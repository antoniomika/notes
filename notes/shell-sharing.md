---
title: Shell Sharing using TCP Sockets
tags:
  - blog
emoji: ""
link: ""
date: "2020-08-20"
---

When collaborating on projects in a terminal, there are times when you want to easily share what you're seeing in real time with others. I used to get by using a simple netcat socket and piping output to the remote side of the socket. This worked fairly well, but required standing up the session prior to me needing access to it.

With this in mind, I needed an always-on solution that was available whenever I needed it. I also needed a simple solution for non-terminal users to be able to access whatever I was doing. The obvious solution here can be thought of as video chat and screen sharing applications. The issue is the experience of sharing a terminal with most of these applications leads to a latency ridden experience that hinders collaboration.

I also wanted to continue to be able to use netcat to forward data to the service, meaning it had to be TCP based. I wanted to be able to run something like `htop | tee >(nc example.com 1337)` and be able to see the output in real-time. The solution I found was a Go service that implements a [TCP to websocket forwarder, called seeshell](https://github.com/antoniomika/seeshell). It's a pretty straightforward service that also adds a xterm terminal to load forwarded data.

The beauty of this system is you can make a client to handle any usecases you want. Which is where another project I made came up, [shellshare](https://github.com/antoniomika/shellshare). shellshare allows you to share any command over seeshell and allow other users to access it. We can modify the CLI to use different events to decide whether or not remote user access is allowed or not.
