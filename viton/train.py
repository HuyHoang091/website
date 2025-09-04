"""
VTON Demo: training & inference pipeline (PyTorch)
- Uses your provided VITONDataset and networks (SegGenerator, GMM, ALIASGenerator).
- Trains a lightweight end-to-end model and saves a single .pth checkpoint.
- Provides an inference script that loads the .pth and performs try-on on (train) samples.

Notes:
- This is a pragmatic, simplified training loop designed to overfit on a small dataset for demo-quality results.
- Losses: segmentation CE for SegGenerator, L1 for final image from ALIASGenerator, perceptual (optional if torchvision available), and grid regularization for GMM.
- If you want *only* to overfit (best demo on train images), set epochs high and keep augmentation off.

You will typically organize your project like:
project/
  dataset.py          # your provided VITONDataset & VITONDataLoader (paste there)
  network.py          # your provided NETWORK classes (paste there)
  train.py            # below script
  infer.py            # below script
  configs/...

Below are two files in one canvas: `train.py` and `infer.py`.
"""

# ==============================
# file: train.py
# ==============================
import os
import math
import json
from dataclasses import dataclass
from typing import Optional

import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from torchvision.utils import save_image

# Import your dataset & networks
from datasets import VITONDataset, VITONDataLoader
from networks import SegGenerator, GMM, ALIASGenerator


# ------------------------------
# Options / Config
# ------------------------------
@dataclass
class TrainOptions:
    # data
    dataset_dir: str = "./data"                     # root folder containing subfolders + list file
    dataset_mode: str = "train"                      # subfolder name under dataset_dir
    dataset_list: str = "train_pairs.txt"            # list file under dataset_dir

    # image geometry
    load_height: int = 256
    load_width: int = 192
    semantic_nc: int = 13

    # model
    grid_size: int = 5                                # TPS control grid
    ngf: int = 64
    norm_G: str = "aliasinstance"                    # used by ALIAS blocks
    num_upsampling_layers: str = "more" #most              # [normal|more|most]
    init_type: str = "xavier"
    init_variance: float = 0.02

    # train
    batch_size: int = 4
    workers: int = 4
    shuffle: bool = True
    epochs: int = 20
    lr: float = 2e-4
    lambda_l1: float = 10.0
    lambda_ce: float = 1.0
    lambda_grid: float = 2.0
    lambda_perc: float = 0.0                          # set >0 to enable perceptual loss (requires torchvision.models.vgg)

    # misc
    out_dir: str = "./runs/vton_demo"
    save_every: int = 2
    device: str = "cuda" if torch.cuda.is_available() else "cpu"


# ------------------------------
# Utilities
# ------------------------------

def one_hot(labels: torch.Tensor, num_classes: int) -> torch.Tensor:
    """labels: (B,H,W) int64 -> (B,C,H,W) float one-hot."""
    b, h, w = labels.shape
    out = torch.zeros(b, num_classes, h, w, device=labels.device)
    return out.scatter_(1, labels.unsqueeze(1), 1.0)


def grid_regularization(theta: torch.Tensor) -> torch.Tensor:
    """Simple L2 on TPS theta to keep warps gentle."""
    return (theta ** 2).mean()


class PerceptualLoss(nn.Module):
    def __init__(self):
        super().__init__()
        try:
            from torchvision.models import vgg16
            vgg = vgg16(weights=None)  # No weights to avoid internet; feel free to load pretrained if available.
            self.features = nn.Sequential(*list(vgg.features.children())[:16]).eval()
            for p in self.features.parameters():
                p.requires_grad = False
        except Exception:
            self.features = None

    def forward(self, x, y):
        if self.features is None:
            return x.abs().mean() * 0.0
        fx = self.features(x)
        fy = self.features(y)
        return F.l1_loss(fx, fy)


# ------------------------------
# Model Wrapper (forward path)
# ------------------------------
class VTONModel(nn.Module):
    def __init__(self, opt: TrainOptions):
        super().__init__()
        # GMM: warp cloth using (parse_agnostic + pose) context
        self.gmm = GMM(opt, inputA_nc=3, inputB_nc=opt.semantic_nc + 3)
        # Segmentation generator predicts parsing to guide rendering
        seg_in_nc = 3 + 3 + 1 + opt.semantic_nc   # img_agnostic + pose + warped_mask + parse_agnostic
        self.seg = SegGenerator(opt, input_nc=seg_in_nc, output_nc=opt.semantic_nc)
        # Renderer
        alias_in_nc = 3 + 3 + 3 + 1 + opt.semantic_nc  # img_agnostic + pose + warped_cloth + warped_mask + seg(one-hot)
        self.alias = ALIASGenerator(opt, input_nc=alias_in_nc)

    def forward(self, batch):
        img = batch['img']                      # (B,3,H,W)  [-1,1]
        img_agn = batch['img_agnostic']         # (B,3,H,W)
        pose = batch['pose']                    # (B,3,H,W)
        parse_agn = batch['parse_agnostic']     # (B,C,H,W)  one-hot style (float)
        cloth = batch['cloth']['unpaired']      # (B,3,H,W)
        cmask = batch['cloth_mask']['unpaired'] # (B,1,H,W)

        # GMM warp
        gmm_cond = torch.cat([parse_agn, pose], dim=1)
        theta, grid = self.gmm(cloth, gmm_cond)
        warped_cloth = F.grid_sample(cloth, grid, align_corners=True)
        warped_mask  = F.grid_sample(cmask, grid, align_corners=True)

        # Predict seg map
        seg_in = torch.cat([img_agn, pose, warped_mask, parse_agn], dim=1)
        seg_logits = self.seg(seg_in)           # (B,C,H,W), sigmoid in your SegGenerator -> bound [0,1]
        seg_prob = seg_logits

        # Use predicted seg (soft) as guidance
        alias_in = torch.cat([img_agn, pose, warped_cloth, warped_mask, seg_prob], dim=1)
        misalign_mask = 1.0 - warped_mask       # hint for ALIAS blocks
        pred = self.alias(alias_in, seg_prob, seg_prob, misalign_mask)
        return pred, seg_logits, warped_cloth, warped_mask, theta


# ------------------------------
# Training
# ------------------------------

def train(opt: TrainOptions):
    os.makedirs(opt.out_dir, exist_ok=True)

    # Dataset & loader
    dset = VITONDataset(opt)
    loader = DataLoader(dset, batch_size=opt.batch_size, shuffle=opt.shuffle,
                        num_workers=opt.workers, pin_memory=True, drop_last=True)

    # Model
    model = VTONModel(opt).to(opt.device)
    model.train()

    # Losses
    l1 = nn.L1Loss()
    ce = nn.CrossEntropyLoss()
    perc = PerceptualLoss().to(opt.device) if opt.lambda_perc > 0 else None

    # Optimizer
    optim = torch.optim.Adam(model.parameters(), lr=opt.lr, betas=(0.5, 0.999))

    global_step = 0
    for epoch in range(1, opt.epochs + 1):
        for batch in loader:
            for k in batch:
                if isinstance(batch[k], torch.Tensor):
                    batch[k] = batch[k].to(opt.device)
                elif isinstance(batch[k], list):
                    batch[k] = [x.to(opt.device) if isinstance(x, torch.Tensor) else x for x in batch[k]]
                elif isinstance(batch[k], dict):
                    batch[k] = {kk: (vv.to(opt.device) if isinstance(vv, torch.Tensor) else vv) for kk, vv in batch[k].items()}

            pred, seg_logits, warped_cloth, warped_mask, theta = model(batch)

            # Supervision targets
            gt_img = batch['img']
            # parse_agnostic is a reduced 13-class one-hot map; create class index for CE
            with torch.no_grad():
                gt_parse_idx = batch['parse_agnostic'].argmax(dim=1)  # (B,H,W)

            # Losses
            loss_l1 = l1(pred, gt_img) * opt.lambda_l1
            loss_ce = ce(seg_logits, gt_parse_idx) * opt.lambda_ce
            loss_grid = grid_regularization(theta) * opt.lambda_grid
            loss_perc = perc(pred, gt_img) * opt.lambda_perc if perc is not None else pred.mean() * 0.0

            loss = loss_l1 + loss_ce + loss_grid + loss_perc

            optim.zero_grad()
            loss.backward()
            optim.step()
            print(f"epoch {epoch} step {global_step} | loss {loss.item():.4f} | l1 {loss_l1.item():.4f} ce {loss_ce.item():.4f} grid {loss_grid.item():.4f} perc {loss_perc.item():.4f}")

            if global_step % 50 == 0:
                print(f"epoch {epoch} step {global_step} | loss {loss.item():.4f} | l1 {loss_l1.item():.4f} ce {loss_ce.item():.4f} grid {loss_grid.item():.4f}")
            if global_step % 200 == 0:
                with torch.no_grad():
                    vis = torch.cat([
                        (batch['img_agnostic'] + 1) / 2,
                        (warped_cloth + 1) / 2,
                        (pred + 1) / 2,
                        (gt_img + 1) / 2
                    ], dim=3)
                    save_image(vis, os.path.join(opt.out_dir, f"vis_e{epoch}_s{global_step}.png"), nrow=4)

            global_step += 1

        if (epoch % opt.save_every) == 0 or (epoch == opt.epochs):
            ckpt = {
                'epoch': epoch,
                'model': model.state_dict(),
                'opt': opt.__dict__
            }
            path = os.path.join(opt.out_dir, f"vton_demo_e{epoch}.pth")
            torch.save(ckpt, path)
            print(f"[+] Saved checkpoint: {path}")


if __name__ == "__main__":
    # Quick start: adjust the paths as needed
    opt = TrainOptions(
        dataset_dir="./datasets",            # <- change to your path
        dataset_mode="train",                   # the subfolder containing image/, cloth/, cloth-mask/, openpose-*/ etc.
        dataset_list="train_pairs.txt",         # the list file under dataset_dir
        epochs=10,
        batch_size=2,
        workers=4,
        load_height=256,
        load_width=192,
        semantic_nc=13,
        out_dir="./checkpoints"
    )
    train(opt)