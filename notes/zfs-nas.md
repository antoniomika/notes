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
your data, with 2 copies stored in two different locations/media, and 1 copy stored at an offsite location.
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
- [samba](https://www.samba.org/) for Windows
- [netatalk](https://netatalk.io/) for macOS/Time Machine

The backup targets would be machines running Ubuntu Server 22.04 LTS. All backup data would be stored in ZFS,
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
cost us anything to use (a huge benefit due to the fact that ZFS is CoW), so we can feel safe knowing that we can use them.

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
  > have different encryption keys per dataset.

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

  # Create an encrypted dataset for macos
  zfs create -o encryption=aes-256-gcm \
    -o keylocation=prompt \
    -o keyformat=passphrase \
    backup/macos

  # Create an encrypted dataset for windows
  zfs create -o encryption=aes-256-gcm \
    -o keylocation=prompt \
    -o keyformat=passphrase \
    backup/windows
  ```

### SSH Setup (borg and rsync)

### Samba Setup

### Netatalk Setup

## Replication Setup

### ZFS Snapshots

### Automated send and receive
