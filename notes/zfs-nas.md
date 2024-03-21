---
title: Roll you own ZFS NAS
tags:
  - blog
emoji: ""
link: ""
date: "2024-03-13"
---

## Background

Recently I've noticed an uptick in the engagement found within the self-hosting community,
so I've decided to start a series of posts that look into why and how I handle self-hosting.
Today's post will focus on data storage and will look into some of the options available when
it comes to data backups.

Data storage is hard. Data backup is even harder. Therefore, I spent some time recently
to re-evaluate my backup strategy. Prior to deciding to roll my own backup solution, I would generally
backup files to Google Drive as my main "backup" mechanism. This was quite a shameful setup but gave
me a good amount of storage with easy access to all of my data. I used the Enterprise Workspace plan
which gave me access to as much storage as I needed, but Google soon changed their offering. I was using
~9TB of storage at that time, so once they removed the "as much as you need" provision, I had to use 2 users
worth of pooled storage. This amounts to ~$40/mo, which is still not terrible for data storage that is
fairly reliable.

## It's as easy as 3-2-1

When architecting my new backup strategy, I decided it was time for an upgrade. Generally, the 3-2-1
data backup method is recommended. The idea with this strategy is you maintain *3* different copies of
your data, with *2* copies stored in two different locations/media, and *1* copy stored at an offsite location.
This setup is pretty easy to achieve and provides pretty good fault-tolerance and disaster recovery.
It also ensures that your data is protected when the unthinkable happens.

```text
|--------|    |---------|    |---------|
|   3    | -> | 2 Media | -> |    1    |
| Copies |    |  Types  |    | Offsite |
|--------|    |---------|    |---------|
```

Achieving this backup strategy isn't particularly difficult to do. A simple setup with this scheme could
be done with the following:

- Primary data source (a laptop)
- A backup of the primary data source (a usb or external hard drive)
- A backup of the primary data source (a cloud backup)

With a setup like this, we end up with 3 copies of our data. We have at least 2 different types of media
(external hard drive and cloud storage), and one copy offsite (in the cloud). Therefore, we should have
fairly decent data redundancy.

## My strategy

Based on the above and for my own purposes, I decided a viable backup process would involve the following:

- Primary data source (laptops, desktops, phones, etc)
- A backup of the primary data to the NAS at home
- A backup of the NAS at home to a similar NAS offsite
- A backup of the NAS to the cloud

This scheme gives me a decent amount of flexibility and options for backing up my data, as well as generally
follows the 3-2-1 rule I described above. The main benefit of using this method is that each device I backup only
needs to keep track of a single backup target. That backup target then can be easily backed up to a secondary target
without the primary device needing to have any intervention. In the event the backup target is destroyed, it can be
replaced by the secondary target, and the secondary target replaced by a new device with all of the data replicated
to it. This ensures that in the event a device is lost, data is still well protected and devices can be replaced easily
with minimal downtime since we can promote devices to take each other's place as needed.

## Technologies

Primary data sources would be backed up using the following:

- [Borg](https://www.borgbackup.org/) (via [Borgmatic](https://torsion.org/borgmatic/) or [Vorta](https://vorta.borgbase.com/)) for linux/macos hosts using
- [rsync](https://rsync.samba.org/) for random hosts/data that don't need dedupe and other Borg niceties
- [samba](https://www.samba.org/) for macOS/Windows

The backup targets would be machines running *Ubuntu Server 22.04 LTS*. All backup data would be stored in *ZFS*,
which would ultimately make our desired scheme trivial to implement. They would have the following configuration:

- 32gb of ram
- 8 core cpu, 3.5ghz base clock
- 4 18tb HDDs using ZFS and in a single zpool
- A small HDD for OS install

For the base OS, the default installation parameters were chosen. Regarding the actual backup storage devices (the 18tb HDDs),
a zpool was created that consisted of two mirrored vdevs, with each mirror containing 2 disks. This strategy provides decent
redundancy in the case that a disk fails (we can lose up to one disk in each vdev), while also allowing us to grow the pool in
the future. If the pool is ever running low on data, we can easily add another vdev of 2 disks to increase the capacity. This
method does result in our storage pool having capacity of half the total disk space we have available (18tb * 2 vdevs = 36tb).

Over using zraid, this option gives us fantastic performance, good scalability, and ease of management.

The choice of ZFS simplifies our NAS backups, as we can utilize the ability of ZFS to send and receive snapshots to send backups
of our data. This is a huge benefit as it simplifies the backup process tremendously. Our systems are large enough that the overhead
of running ZFS itself should be neglible, and we can reap huge benefits in our ability to easily replicate our data. Snapshots don't
cost us anything to use (a huge benefit due to the fact that ZFS is CoW, copy-on-write), so we can feel safe knowing that we can use them.

## Backup Setup

### ZFS Setup

The setup process for each NAS was pretty much the same and can be summarized by the following:

1. Install ZFS on Linux and setup the zpool named `backup`:

  ```bash
  # Install ZoL
  apt-get update && apt-get install zfsutils-linux -y

  # Get the list of devices by their ids to ensure
  # they are found correctly when the pool is imported:
  ls /dev/disk/by-id/*

  # Create the mirrored pool with the first vdev
  zpool create -o ashift={ashift} backup mirror \
    /dev/disk/by-id/{device_id_here} \
    /dev/disk/by-id/{device_id_here}

  # Add another vdev to the pool (can be done as many times as we want, expanding the pool)
  zpool add -o ashift={ashift} backup mirror \
    /dev/disk/by-id/{device_id_here} \
    /dev/disk/by-id/{device_id_here}

  # Enable compression for the pool (if desired)
  zfs set compression=on backup

  # Disable mounting for the pool (if desired)
  zfs set canmount=off backup
  ```

  > ***NOTE:*** I decided to use `compression=on`, but you can tune this to your own preferences.
  > I also decided not to encrypt the entire zpool, so I could control this per-dataset (and therefore),
  > have different encryption keys per dataset. You should modify these snippets how you want (including)
  > changing variables to what you want them to be.

1. Setup the different datasets you want:

  ```bash
  # Create an encrypted dataset for borg
  zfs create -o encryption=aes-256-gcm \
    -o keylocation=prompt \
    -o keyformat=passphrase \
    backup/borg

  # Create an encrypted dataset for misc
  zfs create -o encryption=aes-256-gcm \
    -o keylocation=prompt \
    -o keyformat=passphrase \
    backup/misc

  # Setup a dataset for samba with some settings we need
  # We disable access times, inherit acls, disable unneeded
  # permissions, and set extended attributes to be stored more
  # optimally for performance. I also set a quota for samba
  # and the descendant data sets to 5T.
  # The quota can also be changed later or switched to `refquota`
  # which does not include snapshot sizes.
  zfs create -o encryption=aes-256-gcm
    -o keylocation=prompt
    -o keyformat=passphrase
    -o atime=off \
    -o dnodesize=auto \
    -o aclinherit=passthrough \
    -o acltype=posixacl \
    -o xattr=sa \
    -o exec=off \
    -o devices=off \
    -o setuid=off \
    -o canmount=on \
    -o quota=5T \
    backup/samba

  # Setup a dataset for windows and inherit the samba configs
  # (but set a different encryption key)
  zfs create -o encryption=aes-256-gcm \
    -o keylocation=prompt \
    -o keyformat=passphrase backup/samba/windows

  # Setup a dataset for macos and inherit the samba configs
  # (but set a different encryption key)
  zfs create -o encryption=aes-256-gcm \
    -o keylocation=prompt \
    -o keyformat=passphrase backup/samba/macos

  # Setup a dataset for public use and inherit the samba configs
  # (but set a different encryption key)
  zfs create -o encryption=aes-256-gcm \
    -o keylocation=prompt \
    -o keyformat=passphrase backup/samba/public
  ```

After running the above, we can see the status of our pool:

```bash
# Get the zpool status
zpool status
```

```bash
  pool: backup
 state: ONLINE
  scan: scrub repaired 0B in 08:40:45 with 0 errors on Sun Mar 10 09:04:46 2024
config:

        NAME                                  STATE     READ WRITE CKSUM
        backup                                ONLINE       0     0     0
          mirror-0                            ONLINE       0     0     0
            {device_id_here}                  ONLINE       0     0     0
            {device_id_here}                  ONLINE       0     0     0
          mirror-1                            ONLINE       0     0     0
            {device_id_here}                  ONLINE       0     0     0
            {device_id_here}                  ONLINE       0     0     0

errors: No known data errors
```

And get our datasets:

```bash
# List our datasets
zfs list -t filesystem
```

```bash
NAME                   USED  AVAIL     REFER  MOUNTPOINT
backup                   0K  34.0T        0K  /backup
backup/borg              0K  34.0T        0K  /backup/borg
backup/misc              0K  34.0T        0K  /backup/misc
backup/samba             0K  5.00T        0K  /backup/samba
backup/samba/macos       0K  5.00T        0K  /backup/samba/macos
backup/samba/public      0K  5.00T        0K  /backup/samba/public
backup/samba/windows     0K  5.00T        0K  /backup/samba/windows
```

### Software Setup

For software that truly isn't necessary to run on the host, I'll be utilizing
[Docker](https://docs.docker.com/engine/) and [Docker Compose](https://docs.docker.com/compose/)
for deployment and software management. I've decided to do this is it makes it easy for me to
manage configuration state and track changes to the deployment strategy as code. Also, this ensures
that any software I run on this host will continue to function even if I move to a different host OS
(for example, if I decide to swith to Debian or Fedora). You could also use [Podman](https://podman.io/)
if you'd like for this step.

> ***NOTE:*** The below settings have a user and password set with `${USER}` and `${PASSWORD}` respectively.
> This is not an environment variable. You need to modify these snippets yourself in order to set it up how you want it.

#### SSH Setup (borg and rsync)

##### Borg

I utilize the [`nold360/borgserver`](https://hub.docker.com/r/nold360/borgserver) image. The image is easy to
configure, and assumes I have the local directories `./sshkeys` and `./data` to store each piece of data
accordingly. User ssh keys are placed in `./sshkeys/clients/`, each being the name of the borg repository that key
will have access to. It's important to note that this file can only contain a single key. Setting `BORG_APPEND_ONLY`
disables data deletion until the `BORG_ADMIN` runs a prune operation. Here's the compose file:

```yml
version: '3.8'
services:
  server:
    image: nold360/borgserver:bookworm
    volumes:
      - ./sshkeys:/sshkeys
      - ./data:/backup
    ports:
      - "22222:22"
    environment:
      BORG_SERVE_ARGS: "--progress --debug"
      BORG_APPEND_ONLY: "yes"
      # BORG_ADMIN: "${USER}"
    restart: always
```

I keep the compose file at the root of the `/backup/borg` dataset. This allows my compose setup to also be included
as part of snapshots.

##### rsync

rsync access is done directly using the host in this situation. I previously used a docker image for this, but decided
it was unnecessary.

#### Samba Setup

I utilize the [`ghcr.io/vremenar/samba`](https://github.com/vremenar/samba/pkgs/container/samba) image,
which is based on [`dperson/samba`](https://hub.docker.com/r/dperson/samba) but updates the samba and
alpine versions. I then utilize a custom samba config for setting Time Machine shares, and the default
configuration provided by the image. Here's the compose file:

```yml
version: '3.8'
services:
  server:
    image: ghcr.io/vremenar/samba:latest
    volumes:
      - ./samba.conf:/samba.conf:ro
      - ./macos:/macos
      - ./public:/public
      - ./windows:/windows
    ports:
      - "139:139"
      - "445:445"
    command: |
      -p -n
      -g "log level = 2"
      -I /samba.conf
      -u "${USER};${PASSWORD}"
      -s "public;/public;yes;yes;yes;all;none;${USER}"
      -s "windows-shared;/windows/shared;yes;no;no;all"
      -s "macos-shared;/macos/shared;yes;no;no;all"
    restart: always
```

This configuration broadcasts 3 shares by default:

1. public, mapped to the `/public` volume. It is browseable (discoverable),
   is read only, and has guest access enabled. All users have access to view
   the share, and there are no admins on the share. The only user that can
   write files to the share is ${USER}. I'll utilize this share for storing
   public assets that I might need on my network (installation scripts, shared
   apps, etc).
2. windows-shared, mapped to `/windows/shared`. This is a shared mount for
   windows machines on the network. All users have access to it and it is
   browseable.
3. macos-shared, mapped to `/macos/shared`. This is a shared mount for
   macOS machines on the network. All users have access to it and it is
   browseable.

There is nothing preventing mac or windows machines from accessing the shared mounts,
but this allows me to set attributes per-share if needed in the future
(such as shadow files and versions in windows). Also, more separation is not a
bad thing in this situation.

For Time Machine, a custom samba.conf is utilized. the contents are as follows:

```text
[${USER}-timemachine]
    comment = ${USER}'s Time Machine
    path = /macos/timemachine/${USER}
    browseable = no
    writeable = yes
    create mask = 0600
    directory mask = 0700
    spotlight = yes
    vfs objects = catia fruit streams_xattr
    fruit:aapl = yes
    fruit:time machine = yes
    valid users = ${USER}
```

Here we create a non-browseable share that has a single valid user. We also set the proper `vfs objects`
settings and mark the share as Time Machine specific.

I keep the compose file and config at the root of the `/backup/samba` dataset. This allows my compose setup to also be included
as part of snapshots like the above.

It's important that you set the right permissions on the path you use within the extra `samba.conf` (like in my situation).
You need to make sure the directory exists in your zfs dataset and has the right permissions so the samba container can
access it. For me, I ran the following:

```bash
# Create the path on the ZFS dataset
mkdir -p macos/timemachine/${USER}

# Set permissions on the path to the smbuser and smb group from within the container
# If you deploy it with a different method than me, you can use `id smbuser` to get
# the correct uid/gid to use.
chown -R 100:101 macos/timemachine/${USER}
```

## Replication Setup

Now that our NAS and different methods of getting data onto our NAS are setup, it's time to setup replication to ensure
our NAS is backed up to a secondary location (the last part of our 3-2-1 solution). To do this, we'll make use of ZFS
Snapshots, which is an easy way to take a snapshot of the current state of a dataset.

### ZFS Snapshots

Because ZFS is a CoW (copy-on-write) filesystem, snapshots don't utilize any extra data and are immutable.
Snapshots can also be sent over a pipe (like with SSH) so they are portable. If desired, snapshots could
even be written to file. The other powerful utility of snapshots is that we can utilize them incrementally,
meaning we only send the changes to a dataset each backup cycle instead of the entire dataset.

In order to take a snapshot, we utilize the `zfs snapshot` command like so:

```bash
# Take a snapshot of the main backup/samba dataset. The snapshot name is `initial`.
# Because we use `-r`, this will also take a snapshot of all child datasets
zfs snapshot -r backup/samba@initial
```

After running this command, we can show our snapshots with the following command:

```bash
# List all items from our zpool that come from backup/samba
zfs list -t all -r backup/samba
```

```bash
NAME                           USED  AVAIL     REFER  MOUNTPOINT
backup/samba                     0K  5.00T        0K  /backup/samba
backup/samba@initial             0K      -        0K  -
backup/samba/macos               0K  5.00T        0K  /backup/samba/macos
backup/samba/macos@initial       0K      -        0K  -
backup/samba/public              0K  5.00T        0K  /backup/samba/public
backup/samba/public@initial      0K      -        0K  -
backup/samba/windows             0K  5.00T        0K  /backup/samba/windows
backup/samba/windows@initial     0K      -        0K  -
```

If we have another zfs machine we can send our snapshots to, we can run something like so:

```bash
# Send the snapshots verbosely (-v) under `backup/samba` with the name `initial` recursively (-R)
# raw (-w), meaning as the encrypted data on disk. Pipe it through `pv` (pipeviewer to see transfer stats)
# and receive it on the server named `backup1`, allowing for interruption (-s), also with verbose info (-v)
# into the dataset named backup/samba.
zfs send -vRw backup/samba@initial | pv | ssh backup1 zfs recv -s -v backup/samba
```

On `backup1`, we can see the snapshots and datasets like above:

```bash
NAME                           USED  AVAIL     REFER  MOUNTPOINT
backup/samba                     0K  5.00T        0K  /backup/samba
backup/samba@initial             0K      -        0K  -
backup/samba/macos               0K  5.00T        0K  /backup/samba/macos
backup/samba/macos@initial       0K      -        0K  -
backup/samba/public              0K  5.00T        0K  /backup/samba/public
backup/samba/public@initial      0K      -        0K  -
backup/samba/windows             0K  5.00T        0K  /backup/samba/windows
backup/samba/windows@initial     0K      -        0K  -
```

The difference is, our datasets are not mounted in each mountpoint. You can see this by running:

```bash
# Use df to see mounted filesystems
df -h
```

In order to mount them, we do the following:

```bash
# Mount all zfs mounts, and load the encryption keys
zfs mount -al
```

For each filesystem, you will be asked for the passphrase that was used when the dataset was created.
This means we can send our encrypted filesystems anywhere (even to a file) and not be worried that our data
can be accessed. This is great for all kinds of reasons and opens up many possibilities. For example, a friend
and I can be each other's offsite backup without being worried of them accessing my data. You can also save snapshots
to a file and store them on a blob storage backend or some storage box in the cloud.

Filesystems can be unmounted using the following:

```bash
# Unmount all zfs mounts, and unload the encryption keys
zfs unmount -au
```

If we take another snapshot on `backup0` and want to send it to `backup1` incrementally, we can do it like so:

```bash
# Take the snapshot
zfs snapshot -r backup/samba@next

# Send snapshots between `initial` and `next` to `backup1`
zfs send -vRwI backup/samba@initial backup/samba@next | pv | ssh backup1 zfs recv -s -v backup/samba
```

### Reconciliation

If you see an error like this:

```bash
send from @initial to backup/samba@next estimated size is 77.1K
send from @initial to backup/samba/public@next estimated size is 43.1K
send from @initial to backup/samba/macos@next estimated size is 112K
send from @initial to backup/samba/windows@next estimated size is 40.6K
total estimated size is 273K
receiving incremental stream of backup/samba@next into backup/samba@next
cannot receive incremental stream: destination backup/samba has been modified
since most recent snapshot
86.8KiB 0:00:00 [ 164KiB/s] [<=>                                             ]                                          
```

You need to reset the state of the receiving pool to the snapshot that was previously sent.
You can do that like so:

```bash
# List snapshots (-t) of the dataset (and children, -r), without headers (-H), and roll it back
# This assumes there is only one snapshot per dataset on the machine, your mileage may vary.
zfs list -Hrt snapshot backup/samba | awk '{print $1}' | xargs -I{} zfs rollback {}
```

You can avoid this by setting each dataset on the remote backup side to readonly like so:

```bash
zfs set readonly=on backup/samba
```

### Automated backups with send and receive

Now that we have all of the tools we need to make backups a reality, let's go ahead and set up an automated way to handle backups.
We will be using `backup0` as our main NAS and `backup1` as our secondary NAS

First, let's create a user on our `backup1` for us to receive ssh connections to:

```bash
# Use adduser to create a user, we can use the defaults for everything.
adduser zfsbackup
```

Next, let's create a SSH key on `backup0` which will be used to access the user:

```bash
# Generate an ed25519 key. Save it to a file like `~/.ssh/id_ed25519_zfsbackup`
# You may choose to have a key per dataset as we can limit which dataset the ssh
# process has access to with `authorized_keys`.
ssh-keygen -t ed25519
```

On `backup1`, allow `zfsbackup` user access to the pool (or specific datasets) we want with only create, mount, and receive permissions:

```bash
# Limit our blast radius by only allowing zfsbackup to create, mount and receive files. Don't allow it to destroy or delete data.
zfs allow -u zfsbackup create,mount,receive backup
```

Also on `backup1`, let's setup the `authorized_keys` file in `/home/zfsbackup/.ssh/authorized_keys` with the following:

```text
command="/opt/backup/ssh.sh backup/samba",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-ed25519 .... root@backup0
```

This file only allows the zfsbackup user to run a single command (`/opt/backup/ssh.sh backup/samba ...`), which is a wrapper around `zfs recv` and
also allows us to get the latest snapshot on the host, which is how we will only incrementally send the snapshots that `backup1` doesn't know
about. This allows us to limit the types of commands the ssh user can run.

Next, the contents of the shell script at `/opt/backup/ssh.sh` is as follows:

```bash
#!/bin/bash

# Set the dataset name the user can access
DATASET_NAME="${1:?Dataset not provided}"

# Go through the exec command that was sent via ssh
case "$SSH_ORIGINAL_COMMAND" in
  recv)
    # Receive the snapshots into the dataset
    zfs recv -v "${DATASET_NAME}"
    ;;
  latest)
    # List the most recent snapshot in the dataset
    zfs list -t snapshot -o name -s creation -H "${DATASET_NAME}" | tail -n 1
    ;;
  *)
    echo "unknown command $DATASET_NAME"
    exit 1
    ;;
esac
```

This prevents the user from making queries about any datasets other than the one pinned in the `authorized_keys` file. This can be easily changed
to allow the user access to any of the datasets in a pool like so:

```bash
#!/bin/bash

# Set the dataset name/parent the user has access to
DATASET_NAME="${1:?Dataset or pool not provided}"

# Set the original command as args
set -- $SSH_ORIGINAL_COMMAND

# Pull the dataset the user wanted to manage
REAL_DATASET="${2:-$DATASET_NAME}"

# Check if the dataset is a child of the allowed parent
if [[ $REAL_DATASET != $DATASET_NAME* ]]; then
  echo "no permissions for dataset $REAL_DATASET"
  exit 1
fi

# Check the command the user wants to run
case "$1" in
  recv)
    # Receive the snapshots
    zfs recv -v "${REAL_DATASET}"
    ;;
  latest)
    # List the latest snapshot for the dataset
    zfs list -t snapshot -o name -s creation -H "${REAL_DATASET}" | tail -n 1
    ;;
  *)
    echo "unknown command $1"
    exit 1
    ;;
esac
```

Put this script somewhere owned by `root` but accessible to other users (and executable). I chose `/opt/backup/ssh.sh`. The directory
and file have permissions `0755` set on it.

> ***NOTE:*** Use these scripts at your own risk. I have not configured them to handle every possible corner case.

We can test that our script is working properly by querying for the latest snapshot:

```bash
ssh -i .ssh/id_ed25519_zfsbackup zfsbackup@backup1 latest
```

```bash
backup/samba@next
```

Now let's setup our cronjob to actually send our updates. On `backup0`, we create a file at `/etc/cron.daily/backup` with the same
permissions `0755` set. I chose to use the run-parts cron setup, but you can choose to do this however you'd like.

The content of the file looks like this:

```bash
#!/bin/bash

# Set our path
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin

# Safe bash defaults
set -euo pipefail

# Create our snapshot name based on todays iso date
SNAPSHOT_NAME="$(date +"%Y-%m-%dT%H:%M:%S-%Z")"

# Iterate through a list of datasets, could just as easily loop through the output of zfs list -t filesystem
for DATASET in samba; do
  # Get the local latest snapshot fpr diffing
  LOCAL_LATEST="$(zfs list -t snapshot -o name -s creation -H "backup/${DATASET}" | tail -n 1)"

  # Check if the local latest snapshot is different than the current state of the filesystem (or if FORCE_BACKUP is set)
  if [ "$(zfs diff "${LOCAL_LATEST}" | wc -l)" = "0" ] && [ -z ${FORCE_BACKUP:-} ]; then
    echo "Skipping backup of backup/${DATASET} as no files have changed."
    continue
  fi

  # Take the snapshot
  echo "Taking snapshot backup/${DATASET}@${SNAPSHOT_NAME}"
  zfs snapshot -r "backup/${DATASET}@${SNAPSHOT_NAME}"

  # Get the latest snapshot on the remote side
  LATEST_SNAPSHOT="$(ssh -i "/root/.ssh/id_ed25519_zfsbackup" zfsbackup@backup1 latest)"
  
  # Send incremental snapshot between the latest on the remote and the one we just took
  echo "Sending incremental snapshots between ${LATEST_SNAPSHOT} backup/${DATASET}@${SNAPSHOT_NAME}"
  zfs send -RwI "${LATEST_SNAPSHOT}" "backup/${DATASET}@${SNAPSHOT_NAME}" | pv | ssh -i "/root/.ssh/id_ed25519_zfsbackup" zfsbackup@backup1 recv
done
```

You can test the cron backup by using:

```bash
# Run the script
/etc/cron.daily/backup

# If the snapshot is new, force send a backup
FORCE_BACKUP=true /etc/cron.daily/backup
```

You can also test it using run-parts:

```bash
# Trigger run-parts for the daily component
run-parts /etc/cron.daily
```

#### Cloud Backups

Use [rsync.net](https://www.rsync.net/products/zfsintro.html) and send and receive as if you built a second NAS like above!

Or, send snapshots as a blob to [BackBlaze B2](https://www.backblaze.com/cloud-storage). For example:

```bash
# Send a snapshot incrementally and upload it to b2
zfs send -vRwI backup/samba@initial backup/samba@next | pv | b2 upload-unbound-stream zfs-backups - backup-samba-initial-backup-samba-next
```

And receive the snapshot like so:

```bash
# Receive a snapshot from b2
b2 download-file-by-name zfs-backups backup-samba-initial-backup-samba-next - | pv | zfs recv -s -v backup/samba
```

## Monitoring

For monitoring my systems, I use [Prometheus](https://prometheus.io/) and [Grafana](https://grafana.com/) exclusively.
I won't go into setting up those two services, but I use the following docker-compose.yml for these deployments:

```yml
version: "3.8"

services:
  node-exporter:
    image: quay.io/prometheus/node-exporter:latest
    restart: always
    volumes:
      - /:/host:ro,rslave
    network_mode: host
    pid: host
    command:
      - --path.rootfs=/host
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    restart: always
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    ports:
      - 9080:8080
    privileged: true
    devices:
      - /dev/kmsg
  smartctl-exporter:
    image: prometheuscommunity/smartctl-exporter:latest
    restart: always
    ports:
      - 9633:9633
    privileged: true
    user: root
```

This compose file lives in `/backup/misc/monitoring`, so it is also retained as part of my backups.

Here are some graphs from Grafana:

![smart status 1](/images/zfs-nas/smart-1.png)
![smart status 2](/images/zfs-nas/smart-2.png)
![smart status 3](/images/zfs-nas/smart-3.png)

![docker status 1](/images/zfs-nas/docker-1.png)
![docker status 2](/images/zfs-nas/docker-2.png)


## Networking

I utilize [ZeroTier](https://www.zerotier.com/) to maintain a secure network for my devices to communicate on. You can use any method you may choose.


## Acknowledgements

There are tools available that can help with setting up syncing and replicating ZFS datasets.
(see [Sanoid/Syncoid](https://github.com/jimsalterjrs/sanoid)). I'm a firm believer in knowing everything about your data,
which is why I chose to role things on my own. This guide is to serve as an aide when it comes to choosing what is best
for yourself and your data.

If you have any questions or comments, feel free to shoot me an [email](mailto:me@antoniomika.me) or message me on [IRC](https://web.libera.chat/#pico.sh). 
