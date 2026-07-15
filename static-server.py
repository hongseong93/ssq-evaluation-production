from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent / "out"


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        clean = path.split("?", 1)[0].split("#", 1)[0].strip("/")
        if clean == "":
            target = ROOT / "index.html"
        else:
            target = ROOT / clean
            if target.is_dir():
                html_sibling = target.with_suffix(".html")
                if html_sibling.exists():
                    target = html_sibling
                else:
                    target = target / "index.html"
            elif not target.exists() and (ROOT / f"{clean}.html").exists():
                target = ROOT / f"{clean}.html"
        return str(target)

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", 3000), Handler)
    server.serve_forever()
