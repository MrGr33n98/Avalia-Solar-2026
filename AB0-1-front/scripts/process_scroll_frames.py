#!/usr/bin/env python3
"""
Script de processamento de assets para animações 3D controladas por scroll
(Padrão Apple / Awwwards — Canvas Scrubbing Zero-Lag).

Extrai quadros de um vídeo MP4, equaliza o fundo para branco puro absoluto (#FFFFFF),
remove vinhetas periféricas e exporta em WebP otimizado.

Uso:
  python scripts/process_scroll_frames.py \
    --video public/videos/O_Raio_X_e_Fluxo_de_Energi.mp4 \
    --output public/videos/raio-x-fluxo-energia-frames \
    --target-fps 12 \
    --quality 88
"""

import argparse
import os
import sys

try:
    import cv2
    import numpy as np
    from PIL import Image
except ImportError as exc:
    print(
        "[ERRO] Dependências faltando. Instale com:\n"
        "  pip install opencv-python-headless pillow numpy\n",
        file=sys.stderr,
    )
    raise SystemExit(1) from exc


def process_video_to_clean_frames(
    video_path: str,
    output_dir: str,
    target_fps: int = 12,
    quality: int = 88,
    edge_pad_px: int = 60,
    white_threshold: float = 225.0,
    mobile_output_dir: str | None = None,
    mobile_max_width: int = 800,
    mobile_quality: int = 82,
):
    os.makedirs(output_dir, exist_ok=True)
    if mobile_output_dir:
        os.makedirs(mobile_output_dir, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Não foi possível abrir o vídeo: {video_path}")

    total_raw_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    native_fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    src_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    src_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    step = max(1, int(round(native_fps / target_fps)))

    print(
        f"[INFO] Processando '{video_path}':\n"
        f"       • {total_raw_frames} quadros fonte @ {native_fps:.2f} fps\n"
        f"       • Dimensão: {src_w}x{src_h}\n"
        f"       • Step = {step} (~{target_fps} fps de saída)\n"
        f"       • Saída desktop -> '{output_dir}'\n"
        + (
            f"       • Saída mobile  -> '{mobile_output_dir}' (max {mobile_max_width}px larg)\n"
            if mobile_output_dir
            else ""
        )
    )

    frame_idx = 0
    saved_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % step == 0:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            arr = rgb.astype(np.float32)
            h, w, _ = arr.shape

            y, x = np.ogrid[:h, :w]
            cy, cx = h / 2.0, w / 2.0

            r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
            lum = 0.299 * r + 0.587 * g + 0.114 * b

            # 1. Nivelamento de ponto de branco (Highlight Lift)
            for c in range(3):
                scaled = arr[:, :, c] * (255.0 / white_threshold)
                arr[:, :, c] = np.where(
                    arr[:, :, c] > 170, np.clip(scaled, 0.0, 255.0), arr[:, :, c]
                )

            # 2. Suavização e eliminação de bordas/vinhetas periféricas
            mask_x = np.minimum(x, w - 1 - x) / float(edge_pad_px)
            mask_y = np.minimum(y, h - 1 - y) / float(edge_pad_px)
            edge_fade = np.clip(np.minimum(mask_x, mask_y), 0.0, 1.0)

            for c in range(3):
                is_bg = lum > 140
                arr[:, :, c] = np.where(
                    is_bg,
                    255.0 - (255.0 - arr[:, :, c]) * edge_fade,
                    arr[:, :, c],
                )

            arr = np.clip(arr, 0.0, 255.0).astype(np.uint8)

            out_img = Image.fromarray(arr, "RGB")
            file_name = f"frame_{saved_count:03d}.webp"
            out_img.save(
                os.path.join(output_dir, file_name),
                "WEBP",
                quality=quality,
                method=4,
            )

            if mobile_output_dir:
                ratio = mobile_max_width / float(w)
                new_h = max(1, int(round(h * ratio)))
                mobile_img = out_img.resize(
                    (mobile_max_width, new_h), Image.LANCZOS
                )
                mobile_img.save(
                    os.path.join(mobile_output_dir, file_name),
                    "WEBP",
                    quality=mobile_quality,
                    method=5,
                )

            saved_count += 1
            if saved_count % 10 == 0:
                print(f"       • {saved_count} quadros salvos...")

        frame_idx += 1

    cap.release()

    total_size_mb = (
        sum(
            os.path.getsize(os.path.join(output_dir, f))
            for f in os.listdir(output_dir)
        )
        / (1024 * 1024)
    )
    print(
        f"\n[SUCESSO] {saved_count} quadros gerados.\n"
        f"         • Desktop: '{output_dir}' (~{total_size_mb:.1f} MB)\n"
    )
    if mobile_output_dir:
        mobile_size_mb = (
            sum(
                os.path.getsize(os.path.join(mobile_output_dir, f))
                for f in os.listdir(mobile_output_dir)
            )
            / (1024 * 1024)
        )
        print(f"         • Mobile:  '{mobile_output_dir}' (~{mobile_size_mb:.1f} MB)")

    return saved_count


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extrai e equaliza quadros WebP para scroll scrubbing 3D."
    )
    parser.add_argument("--video", required=True, help="Caminho para o vídeo .mp4")
    parser.add_argument(
        "--output", required=True, help="Diretório de saída para frames desktop"
    )
    parser.add_argument(
        "--output-mobile",
        default=None,
        help="Diretório de saída para frames mobile (resolução reduzida)",
    )
    parser.add_argument(
        "--target-fps", type=int, default=12, help="FPS alvo (padrão 12)"
    )
    parser.add_argument(
        "--quality", type=int, default=88, help="Qualidade WebP desktop (0-100)"
    )
    parser.add_argument(
        "--mobile-quality", type=int, default=82, help="Qualidade WebP mobile (0-100)"
    )
    parser.add_argument(
        "--mobile-max-width",
        type=int,
        default=800,
        help="Largura máxima dos frames mobile (px)",
    )
    parser.add_argument(
        "--edge-pad-px",
        type=int,
        default=60,
        help="Tamanho da zona de fade periférico em px",
    )
    parser.add_argument(
        "--white-threshold",
        type=float,
        default=225.0,
        help="Limite de brilho para o highlight lift",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = _parse_args()
    process_video_to_clean_frames(
        video_path=args.video,
        output_dir=args.output,
        target_fps=args.target_fps,
        quality=args.quality,
        edge_pad_px=args.edge_pad_px,
        white_threshold=args.white_threshold,
        mobile_output_dir=args.output_mobile,
        mobile_max_width=args.mobile_max_width,
        mobile_quality=args.mobile_quality,
    )
