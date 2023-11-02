#!/usr/bin/python

import sys
import json
import hashlib
import os
import shutil
import subprocess

def md5sum(filename, blocksize=65536):
    hash = hashlib.sha1()
    count = 1
    with open(filename, "rb") as f:
    #     for block in iter(lambda: f.read(blocksize), b""):
    #         hash.update(block)
        while True:
            count = count + 1
            data = f.read(blocksize)
            if not data:
                break
            hash.update(data)
    return { "hash": hash.hexdigest(), "count": count }

def start(doc):
    for site, output in doc["input"].items():
        hasha = md5sum(os.path.join(doc["state"]["baseDirectory"], site, "a.txt"))
        hashb = md5sum(os.path.join(doc["state"]["baseDirectory"], site, "b.txt"))
        if hasha["hash"] == output["hasha"] and hashb["hash"] == output["hashb"]:
            success = False
            if doc["state"]["iteration"] > 4:
                success = True
        else:
            raise Exception("Hash mismatch site: " + "hasha: " + hasha["hash"] + " hashb: " + hashb["hash"])
        shutil.copy(os.path.join(doc["state"]["baseDirectory"], site, "a.txt"), os.path.join(doc["state"]["transferDirectory"], "a.txt"))
        shutil.copy(os.path.join(doc["state"]["baseDirectory"], site, "b.txt"), os.path.join(doc["state"]["transferDirectory"], "b.txt"))
        break

    if success == True:
        output = { "output": { "message": "hashes match", "files": ["a.txt", "b.txt"] }, "success": success }
    else:
        output = { "output": { "hasha": hasha["hash"], "hashb": hashb["hash"], "counta": hasha["count"], "countb": hashb["count"]  }, "success": success }

    return output
