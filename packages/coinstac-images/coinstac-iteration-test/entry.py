import coinstac
import local
import remote

coinstac.start(local.run, remote.run)
