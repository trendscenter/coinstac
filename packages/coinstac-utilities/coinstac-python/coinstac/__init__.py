#!/usr/bin/env python

import asyncio as _asyncio
import json as _json
import traceback as _tb
from datetime import datetime as _dt
import websockets as _websockets


def _run(local, remote):
    async def _func(websocket, path):
        msg = await websocket.recv()
        try:
            msg = _json.loads(msg)

        except Exception as e:
            await websocket.close(1011, f'JSON data parse failed with {msg}')

        if msg['mode'] == 'remote':
            try:
                start = _dt.now()
                output = await _asyncio.get_event_loop().run_in_executor(None, remote, msg['data'])
                print('Remote exec time:', (_dt.now() - start).total_seconds())
                await websocket.send(_json.dumps({'type': 'stdout', 'data': output, 'end': True}))

            except Exception as e:
                print('### Remote data: ', msg['data'])
                _tb.print_exc()
                await websocket.send(_json.dumps({'type': 'stderr', 'data': str(_tb.format_exc()), 'code': 1, 'end': True}))

        elif msg['mode'] == 'local':
            try:
                start = _dt.now()
                output = await _asyncio.get_event_loop().run_in_executor(None, local, msg['data'])
                print('Local exec time:', (_dt.now() - start).total_seconds())
                await websocket.send(_json.dumps({'type': 'stdout', 'data': output, 'end': True}))

            except Exception as e:
                print('### Local data: ', msg['data'])
                _tb.print_exc()
                await websocket.send(_json.dumps({'type': 'stderr', 'data': str(_tb .format_exc()), 'code': 1, 'end': True}))

        else:
            await websocket.close()

    return _func


def start(localFunction, remoteFunction):
    start_server = _websockets.serve(_run(localFunction, remoteFunction), '0.0.0.0', 8881,  max_size=1048576000)
    print("Python microservice started on 8881")
    _asyncio.get_event_loop().run_until_complete(start_server)
    _asyncio.get_event_loop().run_forever()
