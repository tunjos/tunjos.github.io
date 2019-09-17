---
layout: post
title: Backup Your GPG Key
date: 2019-09-17 14:05:00 +0200
type: BlogPosting
categories: [tips, software]
---
Your GPG key is important for many reasons. It's your verifiable identity used to sign many important things like **emails** and code **commits**.
Here is an easy way to backup your GPG private key using [Paperkey](https://www.jabberwocky.com/software/paperkey/) and/or [qrencode](https://fukuchi.org/works/qrencode/) (QR Code).

Normally, to create a GPG key you would execute a command as such and answer the subsequent prompts:  
`gpg --full-generate-key`  

Display your `<KEY_ID>`.  
[List the specified secret key corresponding to `<email>`, for which a corresponding public key also exists]  
`gpg --keyid-format long --list-secret-keys <email>`

Copy the `<KEY_ID>` the format `1AA2B34567891CD2` and use it to execute the commmand below:  
[Export Secret Key (order of parameters matter)]  
`gpg --output my-secret-key.gpg --export-secret-key <KEY_ID>`  

[You can also export it using it's associated email address `<email>`]    
`gpg --output my-secret-key.gpg --export-secret-key <email>`

[Install [Paperkey](https://www.jabberwocky.com/software/paperkey/)]  
`sudo apt install paperkey`  
Paperkey allows you to export your GPG keys in a simple printable format.  


[Take the secret key in `my-secret-key.gpg` and generate a text file `my-printable-secret-key.txt` that contains the secret data]  
`paperkey --secret-key my-secret-key.gpg --output my-printable-secret-key.txt`

You can now print `my-printable-secret-key.txt` and hide it somewhere safe. :D

In oder to recover your GPG private key from `my-printable-secret-key.txt`, you need to get a copy of your public key `my-public-key.gpg`.

[Take the secret key data in `my-key-text-file.txt` and combine it with `my-public-key.gpg` to reconstruct `my-secret-key.gpg`]  
`paperkey --pubring my-public-key.gpg --secrets my-key-text-file.txt --output my-secret-key.gpg`  

And voila! You have your complete GPG secret key recreated.

**Bonus:**
You can also export your GPG private key as a QR Code. To do so:  
[Install [qrencode](https://fukuchi.org/works/qrencode/)]  
`sudo apt install qrencode`  

[Encode the secret key as QR Code Image (.png file)]  
`paperkey --secret-key my-secret-key.gpg --output-type raw | qrencode --8bit --output my-secret-key.qr.png`

[Don't forget to delete your secret key once you are done]  
`rm my-secret-key.gpg`  
`rm my-printable-secret-key.txt`  
`rm my-secret-key.qr.png`

**Note:** You can also repeat the same procedure to backup your public keys, but this isn't recommended, since public keys are publicly available, as long as your upload them to different key servers.
