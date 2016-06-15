import sys

from random import randint
myint = randint(1, 100)
print myint

sys.stderr.write('My random # was ' + str(myint))
