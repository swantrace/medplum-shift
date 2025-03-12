#!/bin/sh

# Set vm.overcommit_memory to 1
echo "Setting vm.overcommit_memory to 1"
if ! echo 1 > /proc/sys/vm/overcommit_memory; then
  echo "Failed to set vm.overcommit_memory (might be restricted by Fly.io)"
else
  echo "Successfully set vm.overcommit_memory"
fi

# Verify the setting (optional, for logging)
cat /proc/sys/vm/overcommit_memory

# Start Redis with the same command Fly.io uses
exec redis-server --requirepass medplum --port 6379