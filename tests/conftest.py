import pathlib
import sys

# Make the repo root importable so `from api.index import app` resolves in tests.
ROOT = pathlib.Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
