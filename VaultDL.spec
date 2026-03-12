# -*- mode: python ; coding: utf-8 -*-
import os

block_cipher = None

a = Analysis(
    ['VaultDL.pyw'],
    pathex=[os.path.abspath('backend')],
    binaries=[],
    datas=[
        # Bundle the compiled React app
        (os.path.join('frontend', 'dist'), os.path.join('frontend', 'dist')),
        # Bundle the backend Python source files
        (os.path.join('backend', 'main.py'), 'backend'),
    ],
    hiddenimports=[
        # uvicorn (used internally by flaskwebgui for FastAPI)
        'uvicorn',
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.protocols.websockets.websockets_impl',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        # async / http internals
        'anyio',
        'anyio._backends._asyncio',
        'anyio._backends._trio',
        'h11',
        'h11._connection',
        'h11._events',
        'websockets',
        'websockets.legacy',
        'websockets.legacy.server',
        # FastAPI / starlette
        'starlette',
        'starlette.staticfiles',
        'starlette.routing',
        'starlette.middleware',
        'starlette.middleware.cors',
        # yt-dlp
        'yt_dlp',
        'yt_dlp.extractor',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='VaultDL',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,   # No black terminal window!
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='frontend/public/logo.ico',
)
