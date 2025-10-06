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
    dataset_dir: str = "./data"
    dataset_mode: str = "train"
    dataset_list: str = "train_pairs.txt"

    # image geometry
    load_height: int = 256
    load_width: int = 192
    semantic_nc: int = 13

    # model
    grid_size: int = 5
    ngf: int = 64
    norm_G: str = "aliasinstance"
    num_upsampling_layers: str = "more"
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
    lambda_perc: float = 0.0

    # misc
    out_dir: str = "./runs/vton_demo"
    save_every: int = 2
    device: str = "cuda" if torch.cuda.is_available() else "cpu"
    resume: Optional[str] = None   # đường dẫn ckpt để resume


# ------------------------------
# Utilities
# ------------------------------

def one_hot(labels: torch.Tensor, num_classes: int) -> torch.Tensor:
    b, h, w = labels.shape
    out = torch.zeros(b, num_classes, h, w, device=labels.device)
    return out.scatter_(1, labels.unsqueeze(1), 1.0)


def grid_regularization(theta: torch.Tensor) -> torch.Tensor:
    return (theta ** 2).mean()


class PerceptualLoss(nn.Module):
    def __init__(self):
        super().__init__()
        try:
            from torchvision.models import vgg16
            vgg = vgg16(weights=None)
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
# Model Wrapper
# ------------------------------
class VTONModel(nn.Module):
    def __init__(self, opt: TrainOptions):
        super().__init__()
        self.gmm = GMM(opt, inputA_nc=3, inputB_nc=opt.semantic_nc + 3)
        seg_in_nc = 3 + 3 + 1 + opt.semantic_nc
        self.seg = SegGenerator(opt, input_nc=seg_in_nc, output_nc=opt.semantic_nc)
        alias_in_nc = 3 + 3 + 3 + 1 + opt.semantic_nc
        self.alias = ALIASGenerator(opt, input_nc=alias_in_nc)

    def forward(self, batch):
        img = batch['img']
        img_agn = batch['img_agnostic']
        pose = batch['pose']
        parse_agn = batch['parse_agnostic']
        cloth = batch['cloth']['unpaired']
        cmask = batch['cloth_mask']['unpaired']

        gmm_cond = torch.cat([parse_agn, pose], dim=1)
        theta, grid = self.gmm(cloth, gmm_cond)
        warped_cloth = F.grid_sample(cloth, grid, align_corners=True)
        warped_mask  = F.grid_sample(cmask, grid, align_corners=True)

        seg_in = torch.cat([img_agn, pose, warped_mask, parse_agn], dim=1)
        seg_logits = self.seg(seg_in)
        seg_prob = seg_logits

        alias_in = torch.cat([img_agn, pose, warped_cloth, warped_mask, seg_prob], dim=1)
        misalign_mask = 1.0 - warped_mask
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

    # Model + optimizer
    model = VTONModel(opt).to(opt.device)
    optim = torch.optim.Adam(model.parameters(), lr=opt.lr, betas=(0.5, 0.999))

    # Losses
    l1 = nn.L1Loss()
    ce = nn.CrossEntropyLoss()
    perc = PerceptualLoss().to(opt.device) if opt.lambda_perc > 0 else None

    # Resume nếu có
    start_epoch = 1
    global_step = 0
    if opt.resume and os.path.exists(opt.resume):
        print(f"[+] Resuming from {opt.resume}")
        ckpt = torch.load(opt.resume, map_location=opt.device)
        model.load_state_dict(ckpt['model'])
        if 'optim' in ckpt:
            optim.load_state_dict(ckpt['optim'])
        if 'epoch' in ckpt:
            start_epoch = ckpt['epoch'] + 1
        print(f"Resume at epoch {start_epoch}")

    # Loop train
    for epoch in range(start_epoch, opt.epochs + 1):
        for batch in loader:
            for k in batch:
                if isinstance(batch[k], torch.Tensor):
                    batch[k] = batch[k].to(opt.device)
                elif isinstance(batch[k], list):
                    batch[k] = [x.to(opt.device) if isinstance(x, torch.Tensor) else x for x in batch[k]]
                elif isinstance(batch[k], dict):
                    batch[k] = {kk: (vv.to(opt.device) if isinstance(vv, torch.Tensor) else vv) for kk, vv in batch[k].items()}

            pred, seg_logits, warped_cloth, warped_mask, theta = model(batch)
            gt_img = batch['img']

            with torch.no_grad():
                gt_parse_idx = batch['parse_agnostic'].argmax(dim=1)

            loss_l1 = l1(pred, gt_img) * opt.lambda_l1
            loss_ce = ce(seg_logits, gt_parse_idx) * opt.lambda_ce
            loss_grid = grid_regularization(theta) * opt.lambda_grid
            loss_perc = perc(pred, gt_img) * opt.lambda_perc if perc is not None else pred.mean() * 0.0
            loss = loss_l1 + loss_ce + loss_grid + loss_perc

            optim.zero_grad()
            loss.backward()
            optim.step()
            print(f"epoch {epoch} step {global_step} | "
                      f"loss {loss.item():.4f} | l1 {loss_l1.item():.4f} "
                      f"ce {loss_ce.item():.4f} grid {loss_grid.item():.4f} perc {loss_perc.item():.4f}")

            if global_step % 50 == 0:
                print(f"epoch {epoch} step {global_step} | "
                      f"loss {loss.item():.4f} | l1 {loss_l1.item():.4f} "
                      f"ce {loss_ce.item():.4f} grid {loss_grid.item():.4f} perc {loss_perc.item():.4f}")

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
                'optim': optim.state_dict(),
                'opt': opt.__dict__
            }
            path = os.path.join(opt.out_dir, f"vton_demo_e{epoch}.pth")
            torch.save(ckpt, path)
            print(f"[+] Saved checkpoint: {path}")


if __name__ == "__main__":
    opt = TrainOptions(
        dataset_dir="./datasets",
        dataset_mode="train",
        dataset_list="train_pairs.txt",
        epochs=20,
        batch_size=2,
        workers=4,
        load_height=256,
        load_width=192,
        semantic_nc=13,
        out_dir="./checkpoints",
        resume="./checkpoints/vton_demo_e4.pth"  # <-- set ckpt ở đây
    )
    train(opt)
