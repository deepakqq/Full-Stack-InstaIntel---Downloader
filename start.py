import os
import sys
import socket
import subprocess
import webbrowser
import time

def find_available_port(start_port=8000, max_attempts=10):
    """Find an open port starting from start_port."""
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
    return start_port

def main():
    print("=" * 60)
    print("🚀 Starting Instagram Growth Intelligence & Downloader...")
    print("=" * 60)

    # Check virtual environment
    venv_python = os.path.join(os.getcwd(), "venv", "bin", "python")
    if not os.path.exists(venv_python):
        venv_python = sys.executable

    # Build frontend if dist doesn't exist
    dist_dir = os.path.join(os.getcwd(), "frontend", "dist")
    if not os.path.exists(dist_dir):
        print("📦 Building Frontend UI...")
        subprocess.run(["npm", "run", "build"], cwd=os.path.join(os.getcwd(), "frontend"), check=True)

    # Find free port
    port = find_available_port(8000)

    print(f"\n🌐 Web UI & API Server starting on: http://127.0.0.1:{port}")
    print("📁 Downloads directory located at: ./downloads/\n")

    # Start uvicorn
    cmd = [
        venv_python,
        "-m",
        "uvicorn",
        "backend.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        str(port),
        "--reload"
    ]

    try:
        time.sleep(1)
        # Attempt to open browser automatically
        webbrowser.open(f"http://127.0.0.1:{port}")
    except Exception:
        pass

    subprocess.run(cmd)

if __name__ == "__main__":
    main()
