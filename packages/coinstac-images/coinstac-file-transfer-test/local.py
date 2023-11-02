#!/usr/bin/python

import sys
import json
import os
import hashlib
import shutil

def md5sum(filename, blocksize=65536):
    hash = hashlib.sha1()
    with open(filename, "rb") as f:
        for block in iter(lambda: f.read(blocksize), b""):
            hash.update(block)
    return hash.hexdigest()

def start(doc):
    if doc["state"]["iteration"] == 1:
        a = "a" * int(doc["input"]["size"])
        b = "b" * int(doc["input"]["size"])
        text_filea = open(os.path.join(doc["state"]["transferDirectory"], "a.txt"), "w")
        text_filea.write(a)
        text_filea.close()
        text_fileb = open(os.path.join(doc["state"]["transferDirectory"], "b.txt"), "w")
        text_fileb.write(b)
        text_fileb.close()
        hasha = md5sum(os.path.join(doc["state"]["transferDirectory"], "a.txt"))
        hashb = md5sum(os.path.join(doc["state"]["transferDirectory"], "b.txt"))
    else:
        hasha = md5sum(os.path.join(doc["state"]["baseDirectory"], "a.txt"))
        hashb = md5sum(os.path.join(doc["state"]["baseDirectory"], "b.txt"))
        if hasha != doc["input"]["hasha"] or hashb != doc["input"]["hashb"]:
            raise Exception("Hash mismatch at local")
        shutil.copy(os.path.join(doc["state"]["baseDirectory"], "a.txt"), os.path.join(doc["state"]["transferDirectory"], "a.txt"))
        shutil.copy(os.path.join(doc["state"]["baseDirectory"], "b.txt"), os.path.join(doc["state"]["transferDirectory"], "b.txt"))

    output = { "output": { "hasha": hasha, "hashb": hashb } }
    return output
