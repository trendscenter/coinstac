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

    self.cache['logs'].append('Remote_Utils starting...' + "\n")
    data = []
    base_directory = state['baseDirectory'] + sep

    self.cache['logs'].append("\n")
    self.cache['logs'].append('==dpica.dpica_global_methods starting== ' + "\n")
    dpica.dpica_global_methods(self)
    self.cache['logs'].append('==dpica.dpica_global_methods completed== ' + "\n")
    log(self.cache, self.state, "output", "log_remote_global_method_output")

    self.cache['logs'].append('==dpICA_infomax starting.==' + "\n")
    dpica.dpICA_infomax(self)
    self.cache['logs'].append('==dpICA_infomax completed.==' + "\n")
    log(self.cache, self.state, "output", "log_remote_dpica_infomax_output")

    return data

