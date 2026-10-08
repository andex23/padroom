#!/usr/bin/env bash
# Preserve the upstream filesystem/config but flatten layers for Docker's vfs driver.
# Overlay-backed Docker does not need this workaround.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(docker info --format '{{.Driver}}')" != vfs ]]; then exit 0; fi
if [[ "$(uname -s)/$(uname -m)" != Linux/x86_64 ]]; then
  echo 'The vfs optimization currently supports Linux x86_64 only.' >&2; exit 1
fi
digest=sha256:965e2dfb5a23a0d6541b6106541e777b303656ebabd4e878746b189d550c0a66
image=supabase/postgres:17.6.1.095
if [[ "$(docker image inspect "$image" --format '{{index .Config.Labels "padroom.upstream-digest"}}' 2>/dev/null || true)" == "$digest" ]]; then exit 0; fi
if docker image inspect "$image" >/dev/null 2>&1; then exit 0; fi
temp_dir=$(mktemp -d)
trap 'rm -rf "$temp_dir"' EXIT
mkdir -p .tools
if [[ ! -x .tools/crane ]]; then
  curl --fail --location --silent --show-error https://github.com/google/go-containerregistry/releases/download/v0.20.3/checksums.txt -o "$temp_dir/checksums.txt"
  curl --fail --location --silent --show-error https://github.com/google/go-containerregistry/releases/download/v0.20.3/go-containerregistry_Linux_x86_64.tar.gz -o "$temp_dir/go-containerregistry_Linux_x86_64.tar.gz"
  python3 - "$temp_dir" <<'PY'
import hashlib, pathlib, sys
root=pathlib.Path(sys.argv[1]); name='go-containerregistry_Linux_x86_64.tar.gz'
expected=next(line.split()[0] for line in (root/'checksums.txt').read_text().splitlines() if line.split()[1].lstrip('*')==name)
if hashlib.sha256((root/name).read_bytes()).hexdigest()!=expected: raise SystemExit('Crane checksum verification failed')
PY
  tar -xzf "$temp_dir/go-containerregistry_Linux_x86_64.tar.gz" -C "$temp_dir" crane
  install -m 755 "$temp_dir/crane" .tools/crane
fi
reference="registry-1.docker.io/supabase/postgres@$digest"
echo 'Preparing a verified single-layer copy of the Supabase PostgreSQL image for vfs.'
.tools/crane config --platform linux/amd64 "$reference" > "$temp_dir/config.json"
# Crane verifies registry manifest/blob digests. Do not pipe a partial export into Docker.
.tools/crane export --platform linux/amd64 "$reference" "$temp_dir/root.tar"
python3 scripts/import-postgres-image.py "$temp_dir/config.json" "$temp_dir/root.tar" "$digest"
