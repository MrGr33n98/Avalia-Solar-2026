#!/usr/bin/env python3
"""Setup script for cli-anything-avalia."""

from pathlib import Path
from setuptools import find_namespace_packages, setup

ROOT = Path(__file__).parent
README = ROOT / "cli_anything/avalia/README.md"
long_description = README.read_text(encoding="utf-8") if README.exists() else ""

setup(
    name="cli-anything-avalia",
    version="0.1.0",
    description="Agent-Native CLI harness for Avalia Solar 2026 Founder & Backoffice Operations",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Avalia Solar Engineering",
    author_email="engenharia@avaliasolar.com.br",
    url="https://www.avaliasolar.com.br",
    license="MIT",
    packages=find_namespace_packages(include=("cli_anything.*",)),
    python_requires=">=3.10",
    install_requires=[
        "click>=8.0.0",
        "prompt-toolkit>=3.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "cli-anything-avalia=cli_anything.avalia.avalia_cli:main",
            "avalia=cli_anything.avalia.avalia_cli:main",
        ],
    },
    package_data={
        "cli_anything.avalia": ["skills/*.md", "README.md"],
    },
    include_package_data=True,
    zip_safe=False,
)

