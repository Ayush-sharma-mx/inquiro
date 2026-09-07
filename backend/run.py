import subprocess
import sys

if __name__ == "__main__":
    port = sys.argv[1] if len(sys.argv) > 1 else "8000"
    subprocess.run([
        sys.executable, "-m", "uvicorn",
        "app.main:app",
        "--host", "0.0.0.0",
        "--port", port
    ])
