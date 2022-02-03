'''
Decentralized Parallel ICA (“dpICA”) : COINSTAC simulator
This script computes pICA using the INFOMAX criteria in decentralized environment.
Creator : Chan Panichvatana (cpanichvatana1@student.gsu.edu)
Reference: Parallel Independent Component Analysis (pICA): (Liu et al. 2009)
'''

from coinstac_computation import COINSTACPyNode, ComputationPhase
import local_utils


NUM_ITERATIONS = 1

class PhaseLocalCompute(ComputationPhase):
    def _initialize(self):
        self.cache['logs'] = ["==Local logging==" + "\n"]
        self.cache['i'] = 0

    def compute(self):
        out = {}
        self.cache['logs'].append('==Local PCA starting.==' + "\n")
        data = local_utils.calling_dpica(self, self.input_args, self.state)
        self.cache['logs'].append('==Local PCA completed.==' + "\n")

        local_utils.log(self.cache, self.state, "output", "log_local_compute_output")

        self.cache['logs'] = []

        self.cache['i'] += 1
        out['jump_to_next'] = self.cache['i'] >= NUM_ITERATIONS

        return out


class PhaseSaveResult(ComputationPhase):
    def compute(self):

        self.cache['logs'].append('==Local Save Result==' + "\n")
        local_utils.log(self.cache, self.state, "output", "log_local_result_output")



local = COINSTACPyNode(mode='local', debug=True)
local.add_phase(PhaseLocalCompute, multi_iterations=True)
local.add_phase(PhaseSaveResult)

if __name__ == "__main__":
    local.to_stdout()
