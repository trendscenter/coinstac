from setuptools import setup
from setuptools import find_packages
from glob import glob
from os.path import basename
from os.path import dirname
from os.path import join
from os.path import splitext


setup(
    name='coinstac',
    version='0.3.2',
    description='Python utility library for coinstac',
    url='https://github.com/trendscenter/coinstac/coinstac-utilities/coinstac-python',
    author='Ross Kelly',
    author_email='rkelly30@gsu.edu',
    license='MIT',
    packages=['coinstac'],
    install_requires=[
       "asyncio",
       "websockets",
    ],

    classifiers=[
        'Development Status :: 4 - Beta',
        'Intended Audience :: Science/Research',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python :: 3.6',
        'Programming Language :: Python :: 3.7',
    ],
)
