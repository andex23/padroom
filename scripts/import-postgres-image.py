"""Import only an already verified Crane export; preserve upstream execution settings (the CLI supplies its own healthcheck)."""
import json
import subprocess
import sys

config_path, rootfs_path, digest = sys.argv[1:]
config = json.load(open(config_path))['config']
command = ['docker', 'import']
for name, key in [('ENTRYPOINT', 'Entrypoint'), ('CMD', 'Cmd')]:
    if config.get(key):
        command += ['--change', name + ' ' + json.dumps(config[key])]
for value in config.get('Env') or []:
    command += ['--change', 'ENV ' + value]
for name, key in [('USER', 'User'), ('WORKDIR', 'WorkingDir'), ('STOPSIGNAL', 'StopSignal')]:
    if config.get(key):
        command += ['--change', name + ' ' + config[key]]
for port in config.get('ExposedPorts') or {}:
    command += ['--change', 'EXPOSE ' + port]
for volume in config.get('Volumes') or {}:
    command += ['--change', 'VOLUME ' + json.dumps([volume])]
for key, value in (config.get('Labels') or {}).items():
    command += ['--change', 'LABEL ' + key + '=' + json.dumps(value)]
command += ['--change', 'LABEL padroom.upstream-digest=' + digest]
command += [rootfs_path, 'padroom/postgres-flat:17.6.1.095']
subprocess.run(command, check=True)
# Local compatibility alias for the pinned CLI; the derivative is also explicitly named.
subprocess.run(['docker', 'tag', 'padroom/postgres-flat:17.6.1.095', 'supabase/postgres:17.6.1.095'], check=True)
