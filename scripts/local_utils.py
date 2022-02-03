'''
Decentralized Parallel ICA (“dpICA”) : COINSTAC simulator
This script computes pICA using the INFOMAX criteria in decentralized environment.
Creator : Chan Panichvatana (cpanichvatana1@student.gsu.edu)
Reference: Parallel Independent Component Analysis (pICA): (Liu et al. 2009)
'''

import os
import dpica_python as dpica

sep = os.sep

def log(cache, state, target, filename):
    if 'input' == target:
        with open(state['baseDirectory'] + os.sep + filename + '.txt', 'w') as file:
            file.writelines(cache['logs'])
    elif 'output' == target:
        with open(state['outputDirectory'] + os.sep + filename + '.txt', 'w') as file:
            file.writelines(cache['logs'])
    elif 'transfer' == target:
        with open(state['transferDirectory'] + os.sep + filename + '.txt', 'w') as file:
            file.writelines(cache['logs'])


def calling_dpica(self, input_args, state):
    data = []

    self.cache['logs'].append("\n")
    self.cache['logs'].append('==dpica.dpica_local_methods staring.== ' + "\n")
    dpica.dpica_local_methods(self)
    self.cache['logs'].append('==dpica.dpica_local_methods completed.== ' + "\n")

    return data

