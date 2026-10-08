#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
version=2.78.1
case "$(uname -m)" in x86_64) arch=amd64;; aarch64|arm64) arch=arm64;; *) echo 'Unsupported architecture' >&2; exit 1;; esac
case "$(uname -s)" in Linux) platform=linux;; Darwin) platform=darwin;; *) echo 'Unsupported platform' >&2; exit 1;; esac
archive="supabase_${platform}_${arch}.tar.gz"
temp_dir=$(mktemp -d)
trap 'rm -rf "$temp_dir"' EXIT
curl --fail --location --silent --show-error "https://github.com/supabase/cli/releases/download/v${version}/supabase_${version}_checksums.txt" -o "$temp_dir/checksums.txt"
curl --fail --location --silent --show-error "https://github.com/supabase/cli/releases/download/v${version}/${archive}" -o "$temp_dir/$archive"
python3 - "$temp_dir" "$archive" <<'PY'
import hashlib, pathlib, sys
root, name = pathlib.Path(sys.argv[1]), sys.argv[2]
entries = [line.split() for line in (root/'checksums.txt').read_text().splitlines()]
expected = next(checksum for checksum, filename in entries if filename.lstrip('*') == name)
actual = hashlib.sha256((root/name).read_bytes()).hexdigest()
if actual != expected: raise SystemExit('Supabase artifact checksum verification failed')
PY
mkdir -p .tools
tar -xzf "$temp_dir/$archive" -C "$temp_dir" supabase
install -m 755 "$temp_dir/supabase" .tools/supabase.new
mv .tools/supabase.new .tools/supabase
.tools/supabase --version
