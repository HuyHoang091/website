import argparse
import os

import torch
from torch import nn
from torch.nn import functional as F
from torch.cuda.amp import autocast
import torchgeometry as tgm

from datasets import VITONDataset, VITONDataLoader
from networks import SegGenerator, GMM, ALIASGenerator
from utils import gen_noise, load_checkpoint, save_images


def get_opt(args=None):
    parser = argparse.ArgumentParser()
    parser.add_argument('--name', type=str, default='test')

    parser.add_argument('-b', '--batch_size', type=int, default=1)
    parser.add_argument('-j', '--workers', type=int, default=1)
    parser.add_argument('--load_height', type=int, default=1024)
    parser.add_argument('--load_width', type=int, default=768)
    parser.add_argument('--shuffle', action='store_true')

    parser.add_argument('--dataset_dir', type=str, default='./datasets/')
    parser.add_argument('--dataset_mode', type=str, default='test')
    parser.add_argument('--dataset_list', type=str, default='test_pairs.txt')
    parser.add_argument('--checkpoint_dir', type=str, default='./checkpoints/')
    parser.add_argument('--save_dir', type=str, default='./results/')

    parser.add_argument('--display_freq', type=int, default=1)

    parser.add_argument('--seg_checkpoint', type=str, default='seg_final.pth')
    parser.add_argument('--gmm_checkpoint', type=str, default='gmm_final.pth')
    parser.add_argument('--alias_checkpoint', type=str, default='alias_final.pth')

    # common
    parser.add_argument('--semantic_nc', type=int, default=13)
    parser.add_argument('--init_type', choices=['normal', 'xavier', 'xavier_uniform', 'kaiming', 'orthogonal', 'none'], default='xavier')
    parser.add_argument('--init_variance', type=float, default=0.02)

    # for GMM
    parser.add_argument('--grid_size', type=int, default=5)

    # for ALIASGenerator
    parser.add_argument('--norm_G', type=str, default='spectralaliasinstance')
    parser.add_argument('--ngf', type=int, default=64)
    parser.add_argument('--num_upsampling_layers', choices=['normal', 'more', 'most'], default='most')

    # toggles
    parser.add_argument('--fp16', action='store_true')
    parser.add_argument('--channels_last', action='store_true')
    parser.add_argument('--no_blur', action='store_true')
    parser.add_argument('--disable_spectral', action='store_true')
    parser.add_argument('--cudnn_benchmark', action='store_true')

    if args is None:
        opt = parser.parse_args()      # CLI
    else:
        opt = parser.parse_args(args)  # API
    return opt

def test(opt, seg, gmm, alias):
    up = nn.Upsample(size=(opt.load_height, opt.load_width), mode='bilinear')
    gauss = None
    if not opt.no_blur:
        gauss = tgm.image.GaussianBlur((15, 15), (3, 3)).cuda()

    test_dataset = VITONDataset(opt)
    test_loader = VITONDataLoader(opt, test_dataset)

    with torch.no_grad():
        for i, inputs in enumerate(test_loader.data_loader):
            img_names = inputs['img_name']
            c_names = inputs['c_name']['unpaired']

            img_agnostic = inputs['img_agnostic'].cuda(non_blocking=True)
            parse_agnostic = inputs['parse_agnostic'].cuda(non_blocking=True)
            pose = inputs['pose'].cuda(non_blocking=True)
            c = inputs['cloth']['unpaired'].cuda(non_blocking=True)
            cm = inputs['cloth_mask']['unpaired'].cuda(non_blocking=True)

            if opt.channels_last:
                img_agnostic = img_agnostic.to(memory_format=torch.channels_last)
                parse_agnostic = parse_agnostic.to(memory_format=torch.channels_last)
                pose = pose.to(memory_format=torch.channels_last)
                c = c.to(memory_format=torch.channels_last)
                cm = cm.to(memory_format=torch.channels_last)

            # Part 1. Segmentation generation
            with autocast(enabled=opt.fp16):
                parse_agnostic_down = F.interpolate(parse_agnostic, size=(256, 192), mode='bilinear')
                pose_down = F.interpolate(pose, size=(256, 192), mode='bilinear')
                c_masked_down = F.interpolate(c * cm, size=(256, 192), mode='bilinear')
                cm_down = F.interpolate(cm, size=(256, 192), mode='bilinear')
                seg_input = torch.cat((cm_down, c_masked_down, parse_agnostic_down, pose_down, gen_noise(cm_down.size()).cuda()), dim=1)

                if opt.channels_last:
                    seg_input = seg_input.to(memory_format=torch.channels_last)

                parse_pred_down = seg(seg_input)
                if gauss is not None:
                    parse_pred = gauss(up(parse_pred_down))
                else:
                    parse_pred = up(parse_pred_down)
                parse_pred = parse_pred.float().argmax(dim=1)[:, None]

            parse_old = torch.zeros(parse_pred.size(0), 13, opt.load_height, opt.load_width, dtype=torch.float).cuda()
            parse_old.scatter_(1, parse_pred, 1.0)

            labels = {
                0:  ['background',  [0]],
                1:  ['paste',       [2, 4, 7, 8, 9, 10, 11]],
                2:  ['upper',       [3]],
                3:  ['hair',        [1]],
                4:  ['left_arm',    [5]],
                5:  ['right_arm',   [6]],
                6:  ['noise',       [12]]
            }
            parse = torch.zeros(parse_pred.size(0), 7, opt.load_height, opt.load_width, dtype=torch.float).cuda()
            for j in range(len(labels)):
                for label in labels[j][1]:
                    parse[:, j] += parse_old[:, label]

            # Part 2. Clothes Deformation
            with autocast(enabled=opt.fp16):
                agnostic_gmm = F.interpolate(img_agnostic, size=(256, 192), mode='nearest')
                parse_cloth_gmm = F.interpolate(parse[:, 2:3], size=(256, 192), mode='nearest')
                pose_gmm = F.interpolate(pose, size=(256, 192), mode='nearest')
                c_gmm = F.interpolate(c, size=(256, 192), mode='nearest')
                gmm_input = torch.cat((parse_cloth_gmm, pose_gmm, agnostic_gmm), dim=1)

                if opt.channels_last:
                    gmm_input = gmm_input.to(memory_format=torch.channels_last)
                    c_gmm = c_gmm.to(memory_format=torch.channels_last)

                _, warped_grid = gmm(gmm_input, c_gmm)
                warped_c = F.grid_sample(c, warped_grid, padding_mode='border', align_corners=False)
                warped_cm = F.grid_sample(cm, warped_grid, padding_mode='border', align_corners=False)

            # Part 3. Try-on synthesis
            with autocast(enabled=opt.fp16):
                misalign_mask = parse[:, 2:3] - warped_cm
                misalign_mask[misalign_mask < 0.0] = 0.0
                parse_div = torch.cat((parse, misalign_mask), dim=1)
                parse_div[:, 2:3] -= misalign_mask

                alias_input = torch.cat((img_agnostic, pose, warped_c), dim=1)
                if opt.channels_last:
                    alias_input = alias_input.to(memory_format=torch.channels_last)
                output = alias(alias_input, parse, parse_div, misalign_mask)

            unpaired_names = []
            for img_name, c_name in zip(img_names, c_names):
                unpaired_names.append('{}_{}'.format(img_name.split('_')[0], c_name))

            save_images(output, unpaired_names, os.path.join(opt.save_dir, opt.name))

            if (i + 1) % opt.display_freq == 0:
                print("step: {}".format(i + 1))



def main():
    opt = get_opt()
    print(opt)

    if not os.path.exists(os.path.join(opt.save_dir, opt.name)):
        os.makedirs(os.path.join(opt.save_dir, opt.name))

    seg = SegGenerator(opt, input_nc=opt.semantic_nc + 8, output_nc=opt.semantic_nc)
    gmm = GMM(opt, inputA_nc=7, inputB_nc=3)
    opt.semantic_nc = 7
    alias = ALIASGenerator(opt, input_nc=9)
    opt.semantic_nc = 13

    load_checkpoint(seg, os.path.join(opt.checkpoint_dir, opt.seg_checkpoint))
    load_checkpoint(gmm, os.path.join(opt.checkpoint_dir, opt.gmm_checkpoint))
    load_checkpoint(alias, os.path.join(opt.checkpoint_dir, opt.alias_checkpoint))

    # Performance options
    if opt.cudnn_benchmark:
        torch.backends.cudnn.benchmark = True

    if opt.disable_spectral:
        try:
            from torch.nn.utils import remove_spectral_norm
            for module in seg.modules():
                try:
                    remove_spectral_norm(module)
                except Exception:
                    pass
            for module in gmm.modules():
                try:
                    remove_spectral_norm(module)
                except Exception:
                    pass
            for module in alias.modules():
                try:
                    remove_spectral_norm(module)
                except Exception:
                    pass
        except Exception:
            pass

    seg.cuda().eval()
    gmm.cuda().eval()
    alias.cuda().eval()

    if opt.channels_last:
        seg.to(memory_format=torch.channels_last)
        gmm.to(memory_format=torch.channels_last)
        alias.to(memory_format=torch.channels_last)
    test(opt, seg, gmm, alias)


if __name__ == '__main__':
    main()