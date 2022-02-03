'''
Decentralized Parallel ICA (“dpICA”) : COINSTAC simulator
This script computes pICA using the INFOMAX criteria in decentralized environment.
Creator : Chan Panichvatana (cpanichvatana1@student.gsu.edu)
Reference: Parallel Independent Component Analysis (pICA): (Liu et al. 2009)
'''



from coinstac_computation import COINSTACPyNode, ComputationPhase, PhaseEndWithSuccess
import remote_utils



class PhaseGlobalCompute(ComputationPhase):

    def _initialize(self):
        self.cache['logs'] = ["==Global logging==" + "\n"]

    def compute(self):
        out = {}
        self.cache['logs'].append('==Global Calling dpica starting.==' + "\n")
        data = remote_utils.calling_dpica(self, self.input_args, self.state)
        self.cache['logs'].append('==Global Calling dpica completed.==' + "\n")

        self.cache['logs'] = []
        return out


class PhaseSendAggregatedResults(ComputationPhase):
    def compute(self):
        out = {}

        self.cache['logs'].append('==End of COINSTAC simulator.==' + "\n")
        remote_utils.log(self.cache, self.state, "output", "log_remote_output")

        self.cache['results'] = []
        return out



remote = COINSTACPyNode(mode='remote', debug=True)
remote.add_phase(PhaseGlobalCompute, multi_iterations=True)
remote.add_phase(PhaseSendAggregatedResults, local_only=True)
remote.add_phase(PhaseEndWithSuccess)

if __name__ == "__main__":
    remote.to_stdout()
