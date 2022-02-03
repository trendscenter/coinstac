'''
Decentralized Parallel ICA (“dpICA”) : COINSTAC simulator
This script computes pICA using the INFOMAX criteria in decentralized environment.
Creator : Chan Panichvatana (cpanichvatana1@student.gsu.edu)
Reference: Parallel Independent Component Analysis (pICA): (Liu et al. 2009)
'''

import numpy as np
from numpy import dot
from numpy.linalg import matrix_rank, inv, matrix_rank, pinv
from numpy.random import permutation
from scipy.linalg import eigh
from scipy.stats import t
from scipy.linalg import sqrtm
from scipy.linalg import norm as mnorm

import time

import dpica_mask_v4 as dpica_mask
import dpica_report_v4 as dpica_report
import math
import os
import copy
from datetime import datetime
sep = os.sep



NUM_SUBJECT = 63
DATASET = "F"
CONSTRAINED_CONNECTION_NUM = 0.17
CONSTRAINED_COMPONENTS_NUM = 1
CONSTRAINED_CONNECTION_AUTO_B = False
ICASSO = True
ICA_RUN_NUMBERS = 2
LOCAL_COM_X = 25
LOCAL_COM_Y = 15
GLOBAL_COM_X = 5
GLOBAL_COM_Y = 3
B_MODALITY_CREATIONB_1TO3 = False
B_MODALITY_CREATION_FROM_MATLAB = False
B_MODALITY_CREATION_FROM_FILE = False
B_DATASET_FIT = True
B_DATASET_777 = not B_DATASET_FIT
B_DATASET_ABCD = not B_DATASET_FIT
B_GLOBAL = True
B_MATLAB_CLEAN_DATA_VALIDATION = False
B_MATLAB_PCA_FLIP_SIGN_X = False
B_MATLAB_PCA_FLIP_SIGN_Y = False
B_MATLAB_PCA_VALIDATION = False
B_MATLAB_ICA_DATA_VALIDATION = False
B_MATLAB_ICA_SPHERE_VALIDATION = False
B_MATLAB_ICA_WEIGHTAA_VALIDATION = False
B_DATASET_XY_SWITCH = False

B_MATLAB_ICA_VALIDATION = False
B_MATLAB_U_VALIDATION = False
B_MATLAB_WEIGHT_VALIDATION = False
B_MATLAB_LOCAL_A_VALIDATION = False



ENDURANCE_C = -1e-3  #  the maximumlly allowed descending trend of entropy;
ENDURANCE_ABS = abs(ENDURANCE_C)

if CONSTRAINED_CONNECTION_AUTO_B:
    CONAUTO = "A"
else:
    CONAUTO = CONSTRAINED_CONNECTION_NUM
if ICASSO:
    Multi = "I"
else:
    Multi = "A"
if ICA_RUN_NUMBERS == 1: Multi = "1"

MYFILENAME = "/" + str(DATASET) + "_Nowhite_ConCon" + str(CONAUTO) + "_ConCom" + str(
    CONSTRAINED_COMPONENTS_NUM) + "_RUN" + str(ICA_RUN_NUMBERS) + "_" + str(Multi) + "_E" + str(
    ENDURANCE_ABS) + "_" + str(LOCAL_COM_X) + "_" + str(LOCAL_COM_Y) + "_" + str(GLOBAL_COM_X) + "_" + str(
    GLOBAL_COM_Y) + "_" + str(B_DATASET_XY_SWITCH) + "/"



if NUM_SUBJECT == 63:
    DATA_SITES_X = "/Clean_data/"
    DATA_SITES = "siteAll63.txt"
    DATA_SITE1 = "site1_63_31.txt"
    DATA_SITE2 = "site2_63_32.txt"
    DATA_PATH_X = "/fmri_gene_full/"
    DATA_PATH_Y = "/fmri_gene_full/"
    DATA_PATH_OUTPUT = MYFILENAME
    MASK_PATH_FILE_NAME = "/mask/mask_fmri_pica_v4.nii.gz"
    MASK_PATH_X = "/mask/"

if ICASSO:
    ICA_RUN_AVERAGE = False
    ICA_RUN_ICASSO = True
else:
    ICA_RUN_AVERAGE = True
    ICA_RUN_ICASSO = False


ANNEAL = 0.90
MAX_STEP = 1000  
SITE_NUM = 2

##############  Declare defaults used below   ##############
MAX_WEIGHT = 1e8 # guess that weights larger than this have blown up
DEFAULT_STOP = 0.000001 # stop training if weight changes below this
DEFAULT_ANNEALDEG = 60 # when angle change reaches this value,
DEFAULT_ANNEALSTEP = 0.90 # anneal by multiplying lrate by this original 0,9 to 0.95 changed by JL
DEFAULT_EXTANNEAL = 0.98 # or this if extended-ICA
DEFAULT_MAXSTEPS = MAX_STEP  # 512      # ]top training after this many steps 512
DEFAULT_MOMENTUM = 0.0 # default momentum weight

DEFAULT_BLOWUP = 1000000000.0 # = learning rate has 'blown up'
DEFAULT_BLOWUP_FAC = 0.8 # when lrate 'blows up,' anneal by this fac
DEFAULT_RESTART_FAC = 0.9 # if weights blowup, restart with lrate
# lower by this factor
MIN_LRATE = 0.000001 # if weight blowups make lrate < this, quit
MAX_LRATE = 0.1 # guard against uselessly high learning rate


DEFAULT_EXTENDED = 0 # default off
DEFAULT_EXTBLOCKS = 1 # number of blocks per kurtosis calculation
DEFAULT_NSUB = 1 # initial default number of assumed sub-Gaussians

DEFAULT_EXTMOMENTUM = 0.5 # momentum term for computing extended-ICA kurtosis
MAX_KURTSIZE = 6000 # max points to use in kurtosis calculation
MIN_KURTSIZE = 2000 # minimum good kurtosis size (flag warning)
SIGNCOUNT_THRESHOLD = 25 # raise extblocks when sign vector unchanged

SIGNCOUNT_STEP = 2 # extblocks increment factor

DEFAULT_SPHEREFLAG = 'on' # use the sphere matrix as the default
#   starting weight matrix
DEFAULT_PCAFLAG = 'off' # don't use PCA reduction
DEFAULT_POSACTFLAG = 'on' # use posact()
DEFAULT_VERBOSE = 1 # write ascii info to calling screen
DEFAULT_BIASFLAG = 1 # default to using bias in the ICA update rule

# --constrained ICA parameters
# Experiment
# CONSTRAINED_COMPONENTS =  3 # NUMBER OF COMPONENTS FROM EACH DATASET BEING CONSTRAINED
# Experiment
CONSTRAINED_COMPONENTS = CONSTRAINED_COMPONENTS_NUM  # NUMBER OF COMPONENTS FROM EACH DATASET BEING CONSTRAINED
CONSTRAINED_CONNECTION = CONSTRAINED_CONNECTION_NUM  # 0.2542   #1  #0.5# CORRELATION THRESHOLD TO BE CONSTRAINEDHIGH THRESHOLD WILL BE STRENGTHENED. 1 mean to do 2 x ICA X and Y
CONSTRAINED_CONNECTION_PROABILITY = 0.05
CONSTRAINED_CONNECTION_AUTO = CONSTRAINED_CONNECTION_AUTO_B  # False     # True for calculating from subject number. p_to_r2 False for setting to 1 default
ENDURANCE = ENDURANCE_C  # -1e-3 # % the maximumlly allowed descending trend of entropy #  -1e-3 or -5e-4, or -1e-4
CRATE_X = 1  # Weight change rate start point
CRATE_Y = 1  # Weight change rate start point
CRATE_PERCENT = 0.9  # Weight change rate
CRATE_OUTBOUND_PERCENT = 0.9  # Weight change rate

ICA_RUN_NUMBER = ICA_RUN_NUMBERS

##############  Set up keyword default values  ##############

epochs = 1 # do not care how many epochs in data

pcaflag = DEFAULT_PCAFLAG;
sphering = DEFAULT_SPHEREFLAG # default flags
posactflag = DEFAULT_POSACTFLAG;
verbose = DEFAULT_VERBOSE;
# block      = DEFAULT_BLOCK         # heuristic default - may need adjustment!
# lrate      = DEFAULT_LRATE;
annealdeg = DEFAULT_ANNEALDEG;
annealstep = 0 # defaults declared below
nochange = DEFAULT_STOP;
momentum = DEFAULT_MOMENTUM;
maxsteps = DEFAULT_MAXSTEPS;

weights = 0 # defaults defined below
biasflag = DEFAULT_BIASFLAG;

DEFAULT_EXTENDED = DEFAULT_EXTENDED;
extblocks = DEFAULT_EXTBLOCKS;
kurtsize_X = MAX_KURTSIZE
kurtsize_Y = MAX_KURTSIZE
signsbias = 0.02 # bias towards super-Gaussian components
extmomentum = DEFAULT_EXTMOMENTUM # exp. average the kurtosis estimates
nsub = DEFAULT_NSUB;

wts_blowup_X = 0 # flag =1 when weights too large
wts_blowup_Y = 0 # flag =1 when weights too large
wts_passed = 0 # flag weights passed as argument

Connect_threshold = CONSTRAINED_CONNECTION # set a threshold to select columns constrained.
MaxComCon = CONSTRAINED_COMPONENTS
trendPara = ENDURANCE #


NCOM_X = LOCAL_COM_X
NCOM_Y = LOCAL_COM_Y
NCOM_X1 = NCOM_X
NCOM_Y1 = NCOM_Y
NCOM_X2 = NCOM_X
NCOM_Y2 = NCOM_Y

Global_NCOM_X = GLOBAL_COM_X
Global_NCOM_Y = GLOBAL_COM_Y
Global_NCOM_X1 = Global_NCOM_X
Global_NCOM_Y1 = Global_NCOM_Y
Global_NCOM_X2 = Global_NCOM_X
Global_NCOM_Y2 = Global_NCOM_Y


def setUp(self):

    printme = ""
    MASK_PATH_FILE_NAME = str(self.state['baseDirectory']) +  "/mask/mask_fmri_pica_v4.nii.gz"
    MASK_PATH_X = self.state['baseDirectory'] + "/mask/"
    DATA_PATH_X = self.state['baseDirectory'] + "/fmri_gene_full/"
    DATA_PATH_Y = self.state['baseDirectory'] + "/fmri_gene_full/"
    DATA_PATH_OUTPUT = self.state['outputDirectory'] + str(MYFILENAME)
    DATA_SITES_X = self.state['baseDirectory'] + "/Clean_data/"

    self.MASK_PATH_FILE_NAME = MASK_PATH_FILE_NAME
    self.MASK_PATH_X = MASK_PATH_X
    self.DATA_PATH_X = DATA_PATH_X
    self.DATA_PATH_Y = DATA_PATH_Y
    self.DATA_PATH_OUTPUT = DATA_PATH_OUTPUT
    self.DATA_SITES_X = DATA_SITES_X

    printme = printme + "==============Global Parameters==============" + "\n"
    printme = printme + "SITE_NUM = " + str(SITE_NUM) + "\n"
    printme = printme + "NUM_SUBJECT = " + str(NUM_SUBJECT) + "\n"
    printme = printme + "MASK_PATH_FILE_NAME =  " +  str(MASK_PATH_FILE_NAME) + "\n"
    printme = printme + "MASK_PATH_X =  " +  str(MASK_PATH_X) + "\n"
    printme = printme + "DATA_PATH_X =  " +  str(DATA_PATH_X) + "\n"
    printme = printme + "DATA_PATH_Y =  " +  str(DATA_PATH_Y) + "\n"
    printme = printme + "DATA_PATH_OUTPUT =  " +  str(DATA_PATH_OUTPUT) + "\n"
    printme = printme + "DATA_SITES_X =  " +  str(DATA_SITES_X) + "\n"
    printme = printme + "MAX_WEIGHT =  " +  str(MAX_WEIGHT) + "\n"
    printme = printme + "DEFAULT_STOP =  " +  str(DEFAULT_STOP) + "\n"
    printme = printme + "DEFAULT_ANNEALDEG =  " +  str(DEFAULT_ANNEALDEG) + "\n"
    printme = printme + "DEFAULT_ANNEALSTEP =  " +  str(DEFAULT_ANNEALSTEP) + "\n"
    printme = printme + "DEFAULT_EXTANNEAL =  " +  str(DEFAULT_EXTANNEAL) + "\n"
    printme = printme + "DEFAULT_MAXSTEPS =  " +  str(DEFAULT_MAXSTEPS) + "\n"
    printme = printme + "DEFAULT_MOMENTUM =  " +  str(DEFAULT_MOMENTUM) + "\n"
    printme = printme + "DEFAULT_BLOWUP =  " +  str(DEFAULT_BLOWUP) + "\n"
    printme = printme + "DEFAULT_BLOWUP_FAC =  " +  str(DEFAULT_BLOWUP_FAC) + "\n"
    printme = printme + "DEFAULT_RESTART_FAC =  " +  str(DEFAULT_RESTART_FAC) + "\n"
    printme = printme + "MIN_LRATE =  " +  str(MIN_LRATE) + "\n"
    printme = printme + "MAX_LRATE =  " +  str(MAX_LRATE) + "\n"
    printme = printme + "DEFAULT_EXTENDED =  " +  str(DEFAULT_EXTENDED) + "\n"
    printme = printme + "DEFAULT_EXTBLOCKS =  " +  str(DEFAULT_EXTBLOCKS) + "\n"
    printme = printme + "DEFAULT_NSUB =  " +  str(DEFAULT_NSUB) + "\n"
    printme = printme + "DEFAULT_EXTMOMENTUM =  " +  str(DEFAULT_EXTMOMENTUM) + "\n"
    printme = printme + "SIGNCOUNT_THRESHOLD =  " +  str(SIGNCOUNT_THRESHOLD) + "\n"
    printme = printme + "DEFAULT_SPHEREFLAG =  " +  str(DEFAULT_SPHEREFLAG) + "\n"
    printme = printme + "DATA_SDEFAULT_PCAFLAGITES =  " +  str(DEFAULT_PCAFLAG) + "\n"
    printme = printme + "DEFAULT_POSACTFLAG =  " +  str(DEFAULT_POSACTFLAG) + "\n"
    printme = printme + "DEFAULT_VERBOSE =  " +  str(DEFAULT_VERBOSE) + "\n"
    printme = printme + "DEFAULT_BIASFLAG =  " +  str(DEFAULT_BIASFLAG) + "\n"
    printme = printme + "CONSTRAINED_COMPONENTS =  " +  str(CONSTRAINED_COMPONENTS) + "\n"
    printme = printme + "CONSTRAINED_CONNECTION =  " +  str(CONSTRAINED_CONNECTION) + "\n"
    printme = printme + "CONSTRAINED_CONNECTION_AUTO =  " +  str(CONSTRAINED_CONNECTION_AUTO) + "\n"
    printme = printme + "DATA_ENDURANCESITES =  " +  str(ENDURANCE) + "\n"
    printme = printme + "NCOM_X =  " +  str(NCOM_X) + "\n"
    printme = printme + "NCOM_Y =  " +  str(NCOM_Y) + "\n"
    printme = printme + "NCOM_X1 =  " +  str(NCOM_X1) + "\n"
    printme = printme + "NCOM_Y1 =  " +  str(NCOM_Y1) + "\n"
    printme = printme + "NCOM_X2 =  " +  str(NCOM_X2) + "\n"
    printme = printme + "NCOM_Y2 =  " +  str(NCOM_Y2) + "\n"
    printme = printme + "Global_NCOM_X =  " +  str(Global_NCOM_X) + "\n"
    printme = printme + "Global_NCOM_Y =  " +  str(Global_NCOM_Y) + "\n"
    printme = printme + "Global_NCOM_X1 =  " +  str(Global_NCOM_X1) + "\n"
    printme = printme + "Global_NCOM_Y1 =  " +  str(Global_NCOM_Y1) + "\n"
    printme = printme + "Global_NCOM_X2 =  " +  str(Global_NCOM_X2) + "\n"
    printme = printme + "Global_NCOM_Y2 =  " +  str(Global_NCOM_Y2) + "\n"
    printme = printme + "signsbias =  " +  str(signsbias) + "\n"
    printme = printme + "ANNEAL =  " +  str(ANNEAL) + "\n"
    printme = printme + "MAX_STEP =  " +  str(MAX_STEP) + "\n"
    printme = printme + "DATA_SITES =  " +  str(DATA_SITES) + "\n"
    printme = printme + "ICA_RUN_NUMBER =  " +  str(ICA_RUN_NUMBER) + "\n"
    printme = printme + "ICA_RUN_AVERAGE =  " +  str(ICA_RUN_AVERAGE) + "\n"
    printme = printme + "ICA_RUN_ICASSO =  " +  str(ICA_RUN_ICASSO) + "\n"
    printme = printme + "ENDURANCE =  " +  str(ENDURANCE) + "\n"
    printme = printme + "CRATE_X =  " +  str(CRATE_X) + "\n"
    printme = printme + "CRATE_Y =  " +  str(CRATE_Y) + "\n"
    printme = printme + "CRATE_PERCENT =  " +  str(CRATE_PERCENT) + "\n"
    printme = printme + "CRATE_OUTBOUND_PERCENT =  " +  str(CRATE_OUTBOUND_PERCENT) + "\n"
    printme = printme + "B_DATASET_FIT =  " +  str("") + "\n"
    printme = printme + "B_DATASET_ABCD =  " +  str("") + "\n"
    printme = printme + "B_DATASET_777 =  " +  str("") + "\n"
    printme = printme + "B_DATASET_XY_SWITCH =  " +  str("") + "\n"
    self.cache['logs'].append(printme + "\n")
    printme = ""



    printme = printme + "[LOG][def_setUp]+++++Set up start+++++" + "\n"
    self.cache['logs'].append(printme + "\n")
    printme = ""
    self.SITE_NUM = int(SITE_NUM)
    self.NCOM_X = NCOM_X
    self.NCOM_Y = NCOM_Y
    self.NCOM_X1 = NCOM_X1
    self.NCOM_Y1 = NCOM_Y1
    self.NCOM_X2 = NCOM_X2
    self.NCOM_Y2 = NCOM_Y2
    self.Global_NCOM_X = Global_NCOM_X
    self.Global_NCOM_Y = Global_NCOM_Y
    self.Global_NCOM_X1 = Global_NCOM_X1
    self.Global_NCOM_Y1 = Global_NCOM_Y1
    self.Global_NCOM_X2 = Global_NCOM_X2
    self.Global_NCOM_Y2 = Global_NCOM_Y2

    self.ICA_RUN_NUMBER = ICA_RUN_NUMBER

    self.RUN_NUMBER = 1
    self.STEP=[0,0]
    self.maxsteps = maxsteps
    self.STOPSIGN=[0,0]

    self.mymaxcorr_list=[]
    self.myentropy_list_X=[]
    self.myentropy_list_Y=[]
    self.mySTEP_list_X=[]
    self.mySTEP_list_Y=[]


    return (self)

def local_setUp(self):

    printme = ""
    printme = printme + "[LOG][Flow_1_Setup]=====Loading Local Modality_X - Start =====" + "\n"

    B_DATASET_FIT = True
    if B_DATASET_FIT :
        # Option 2 from FIT folder
        b_Modality_creation_X = True

        if b_Modality_creation_X :
            self.cache['logs'].append(printme + "\n")
            if SITE_NUM == 2 :
                self.clean_data_X1, self.NSUB_X1, self.NVOX_X1 = \
                    dpica_mask.pica_masked_Modality_X_creation( self.DATA_PATH_X, self.MASK_PATH_FILE_NAME)
    # End if B_DATASET_FIT :


    # Loading Local Modality_Y
    printme = printme + "[LOG][Flow_1_Setup]=====Loading Local Modality_Y - Start =====" + "\n"

    B_DATASET_FIT = True
    if B_DATASET_FIT :
        # Option 2 from FIT folder
        b_Modality_creation_Y = True

        if b_Modality_creation_Y :
            self.cache['logs'].append(printme + "\n")
            if SITE_NUM == 2 :
                self.clean_data_Y1, self.NSUB_Y1, self.NVOX_Y1 = \
                    dpica_mask.pica_Modality_Y_creation(self.DATA_PATH_Y)

    # End if B_DATASET_FIT :

    printme = printme + "[LOG][Flow_1_Setup]=====Loading Local Modality_Y - Finish =====" + "\n"


    #Print initial parameter number
    printme = printme + "[LOG][Flow_1_Setup]=====Print initial parameter number=====" + "\n"
    printme = printme + "NSUB_X1 N_X1 = " + str(self.NSUB_X1) + " NVOX_X1  d_X1 = " + str(self.NVOX_X1) + " NCOM_X1  r_X1 = " + str(self.NCOM_X1) + "\n"
    printme = printme + "NSUB_Y1 N_Y1 = " + str(self.NSUB_Y1) + " NVOX_Y1  d_Y1  = " + str(self.NVOX_Y1) + " NCOM_Y1  r_Y1 = " + str(self.NCOM_Y1) + "\n"

    # Print all Modality data
    printme = printme + "[LOG][Flow_1_Setup]=====Print all Modality data=====" + "\n"
    printme = printme + "Modality_X1 Input===X_X1.shape (N_X1 x d_X1)" + str(self.clean_data_X1.shape) + " NCOMP_X1 (r_X1) = " + str(self.NCOM_X1) + "\n"
    printme = printme + "Modality_Y1 Input===X_Y1.shape (N_Y1 x d_Y1)" + str(self.clean_data_Y1.shape) + " NCOMP_Y1 (r_Y1) = " + str(self.NCOM_Y1) + "\n"



    printme = printme + "[LOG][def_setUp]+++++Set up finish+++++" + "\n"
    self.cache['logs'].append(printme + "\n")

    return (self)

def global_setUp(self):

    printme = ""
    printme = printme + "[LOG][Flow_3_Global_U, White, and deWhite]=====Start=====" + "\n"
    ini_time = datetime.now()

    self.Global_U_X = []
    self.NSUB_All_X = np.zeros(0)
    self.NVOX_All_X = np.zeros(0)
    self.NCOM_All_X = np.zeros(0)
    self.Con_White_X = []
    self.Con_deWhite_X = []

    self.Global_U_Y = []
    self.NSUB_All_Y = np.zeros(0)
    self.NVOX_All_Y = np.zeros(0)
    self.NCOM_All_Y = np.zeros(0)
    self.Con_White_Y = []
    self.Con_deWhite_Y = []


    data_path_for_site = self.state['baseDirectory']

    for site_folders in os.listdir(data_path_for_site):
        data_path_file_name = data_path_for_site + "//" + str(site_folders) + "//"

        # Loading Local_U to Global_U
        file_name = "U_X1.csv"
        clean_data_X1, NCOM_X1, NVOX_X1 = \
            dpica_mask.pica_Modality_XY_creation_from_file1( data_path_file_name, file_name)
        if len(self.Global_U_X) == 0:
            self.Global_U_X = clean_data_X1
            self.NVOX_All_X = np.append(self.NVOX_All_X, int(NVOX_X1))
            self.NCOM_All_X = np.append(self.NCOM_All_X, int(NCOM_X1))
        else:
            self.Global_U_X = np.concatenate((self.Global_U_X, clean_data_X1), axis=0)
            self.NVOX_All_X = np.append(self.NVOX_All_X, int(NVOX_X1))
            self.NCOM_All_X = np.append(self.NCOM_All_X, int(NCOM_X1))

        file_name = "U_Y1.csv"
        clean_data_Y1, NCOM_Y1, NVOX_Y1 = \
            dpica_mask.pica_Modality_XY_creation_from_file1(data_path_file_name, file_name)
        if len(self.Global_U_Y) == 0:
            self.Global_U_Y = clean_data_Y1
            self.NVOX_All_Y = np.append(self.NVOX_All_Y, int(NVOX_Y1))
            self.NCOM_All_Y = np.append(self.NCOM_All_Y, int(NCOM_Y1))
        else:
            self.Global_U_Y = np.concatenate((self.Global_U_Y, clean_data_Y1), axis=0)
            self.NVOX_All_Y = np.append(self.NVOX_All_Y, int(NVOX_Y1))
            self.NCOM_All_Y = np.append(self.NCOM_All_Y, int(NCOM_Y1))



        # Loading Local_White to Global_White
        file_name = "L_white_X1.csv"  # Site X1
        L_white_X1 = dpica_mask.pica_import_csv_to_array(data_path_file_name, file_name)
        if len(self.Con_White_X) == 0:
            self.Con_White_X = L_white_X1
            self.NSUB_All_X = np.append(self.NSUB_All_X, int(L_white_X1.shape[1]))
        else:
            self.Con_White_X = np.concatenate((self.Con_White_X, L_white_X1), axis=1)
            self.NSUB_All_X = np.append(self.NSUB_All_X, int(L_white_X1.shape[1]))

        file_name = "L_white_Y1.csv"  # Site Y1
        L_white_Y1 = dpica_mask.pica_import_csv_to_array(data_path_file_name, file_name)
        if len(self.Con_White_Y) == 0:
            self.Con_White_Y = L_white_Y1
            self.NSUB_All_Y = np.append(self.NSUB_All_Y, int(L_white_Y1.shape[1]))
        else:
            self.Con_White_Y = np.concatenate((self.Con_White_Y, L_white_Y1), axis=1)
            self.NSUB_All_Y = np.append(self.NSUB_All_Y, int(L_white_Y1.shape[1]))


        # Loading Local_deWhite to Global_deWhite
        file_name = "L_dewhite_X1.csv"  # Site X1
        L_dewhite_X1 = dpica_mask.pica_import_csv_to_array(data_path_file_name, file_name)

        if len(self.Con_deWhite_X) == 0:
            self.Con_deWhite_X = L_dewhite_X1
        else:
            self.Con_deWhite_X = np.concatenate((self.Con_deWhite_X, L_dewhite_X1), axis=0)

        file_name = "L_dewhite_Y1.csv"  # Site Y1
        L_dewhite_Y1 = dpica_mask.pica_import_csv_to_array(data_path_file_name, file_name)

        if len(self.Con_deWhite_Y) == 0:
            self.Con_deWhite_Y = L_dewhite_Y1
        else:
            self.Con_deWhite_Y = np.concatenate((self.Con_deWhite_Y, L_dewhite_Y1), axis=0)


    printme = printme + "Modality_X === Global_U_X.shape (sr x d) " + str(np.shape(self.Global_U_X)) + "\n"
    printme = printme + "Modality_Y === Global_U_Y.shape (sr x d) " + str(np.shape(self.Global_U_Y)) + "\n"
    printme = printme + "Modality_X === Con_White_X.shape (r x sN) " + str(np.shape(self.Con_White_X)) + "\n"
    printme = printme + "Modality_Y === Con_White_Y.shape (r x sN) " + str(np.shape(self.Con_White_Y)) + "\n"
    printme = printme + "Modality_X === Con_deWhite_X.shape (sN x r) " + str(np.shape(self.Con_deWhite_X)) + "\n"
    printme = printme + "Modality_Y === Con_deWhite_Y.shape (sN x r) " + str(np.shape(self.Con_deWhite_Y)) + "\n"

    printme = printme + "NSUB_All_X =" + str(self.NSUB_All_X) + "\n"
    printme = printme + "NSUB_All_Y =" + str(self.NSUB_All_Y) + "\n"
    printme = printme + "NCOM_All_X =" + str(self.NCOM_All_X) + "\n"
    printme = printme + "NCOM_All_Y =" + str(self.NCOM_All_Y) + "\n"
    printme = printme + "NVOX_All_X =" + str(self.NVOX_All_X) + "\n"
    printme = printme + "NVOX_All_Y =" + str(self.NVOX_All_Y) + "\n"

    np.savetxt(self.state['outputDirectory'] + "/Global_U_X.csv", self.Global_U_X, delimiter=",")
    np.savetxt(self.state['outputDirectory'] + "/Con_White_X.csv", self.Con_White_X, delimiter=",")
    np.savetxt(self.state['outputDirectory'] + "/Con_deWhite_X.csv", self.Con_deWhite_X, delimiter=",")

    np.savetxt(self.state['outputDirectory'] + "/Global_U_Y.csv", self.Global_U_Y, delimiter=",")
    np.savetxt(self.state['outputDirectory'] + "/Con_White_Y.csv", self.Con_White_Y, delimiter=",")
    np.savetxt(self.state['outputDirectory'] + "/Con_deWhite_Y.csv", self.Con_deWhite_Y, delimiter=",")

    printme = printme + "[LOG][Flow_3_Global_U]Loading Global - Loaded time is " + \
              str(datetime.now() - ini_time) + "\n"

    printme = printme + "[LOG][Flow_3_Global_U, White, and deWhite]=====Stop=====" + "\n"


    self.cache['logs'].append(printme + "\n")
    return (self)

def p_to_r2(self, N):

    prb = CONSTRAINED_CONNECTION_PROABILITY
    df = N - 2
    x = abs(t.ppf(prb, df))
    r = math.sqrt(1/((N-2) + x**2))*x
    return(r)

def norm(self, x):
    """Computes the norm of a vector or the Frobenius norm of a
    matrix_rank

    """
    return mnorm(x.ravel())

def local_reconstruction8(self, GlobalW_unmixer, GlobalA_mixer, Global_deWhite, Con_deWhite, NSUB_All, NCOM_All, SITE_NUMBER, Global=False, Test=False):
    """Computes local A using Global_deWhite and Concatenated_local_deWhite
    *Input
    GlobalW_unmixer : ICA's UnMixing matrix or Weight matrix : srxr
    Global_deWhite :  Global deWhitening and output of Global PCA : srxr
    Concatenated_local_deWhite :  Concatenate L_deWh to Con_deWh: sNxr
    NSUB_All : All subject numbers of each sites in this Modality
    NCOM_All : All component numbers of each sites in this Modality
    SITE_NUMBER : Number of local sites
    verbose: flag to print optimization updates
    *Output
    LocalA : Local mixing matrix : sNxr
    """

    if SITE_NUMBER == 2 :

        L_dWh_1 = Con_deWhite[:int(NSUB_All[0]), :]
        L_dWh_2 = Con_deWhite[int(NSUB_All[0]):(int(NSUB_All[0])+int(NSUB_All[1])), :]

        LocalA_Wh_All = dot(Global_deWhite, GlobalA_mixer)

        Local_Wh_A_1 = LocalA_Wh_All[:int(NCOM_All[0]), :]
        Local_Wh_A_2 = LocalA_Wh_All[int(NCOM_All[0]):(int(NCOM_All[0])+int(NCOM_All[1])), :]

        LocalA_1 = dot(L_dWh_1, Local_Wh_A_1)
        LocalA_2 = dot(L_dWh_2, Local_Wh_A_2)

        LocalA_All = np.concatenate((LocalA_1, LocalA_2),axis = 0)

    return (LocalA_All)

def global_reconstruction8(self, LocalA_All, Global_White, Con_White, NSUB_All, NCOM_All, SITE_NUMBER, Global=False):
    """Computes Global A using Global_White and Concatenated_local_White
    *Input
    LocalA_All : LocalA_All : Local A (mixing) matrix of this Modality : sNxr
    Global_White :  Global Whitening as output of Global PCA : rxsr
    Concatenated_local_White :  Concatenate L_Wh to be Con_White: rxsN
    NSUB_All : All subject numbers of each sites in this Modality : Array of interger numbers
    NCOM_All : All component numbers of each sites in this Modality : Array of interger numbers
    SITE_NUMBER : Number of local sites
    verbose: flag to print optimization updates
    *Output
    GlobalA_mixer : Global A mixing matrix or Loading parameter matrix : srxr
    """

    if SITE_NUMBER == 2 :

        L_Wh_1 = Con_White[:,:int(NSUB_All[0])]
        L_Wh_2 = Con_White[:, int(NSUB_All[0]):(int(NSUB_All[0])+int(NSUB_All[1]))]

        LocalA_1 = LocalA_All[:int(NSUB_All[0]) ,: ]
        LocalA_2 = LocalA_All[ int(NSUB_All[0]):(int(NSUB_All[0])+int(NSUB_All[1])) ,:]

        Local_Wh_A_1 = dot(L_Wh_1, LocalA_1)
        Local_Wh_A_2 = dot(L_Wh_2, LocalA_2)
        Local_Wh_A_All = np.concatenate((Local_Wh_A_1, Local_Wh_A_2),axis = 0)

        GlobalA_mixer = dot(Global_White, Local_Wh_A_All)

    return (GlobalA_mixer)

def dpICA_infomax(self):

    ###########################################################################
    # ICA Infomax flow
    #   - Flow 5
    #   - Flow 6
    #   - Flow 7
    #   - Flow 8
    #   - Flow 8a


    printme = ""
    printme = printme + "[LOG][Flow_5_Global_ICA]]=====Start====="  + "\n"
    printme = printme + "[LOG][Flow_5_Global_ICA]]ICA_RUN_NUMBER = " + \
              str(self.ICA_RUN_NUMBER) + "\n"
    printme = printme + "[LOG][Flow_5_Global_ICA]]ICA_RUN_AVERAGE = " + \
              str(ICA_RUN_AVERAGE) + "\n"
    printme = printme + "[LOG][Flow_5_Global_ICA]]ICA_RUN_ICASSO = " + \
              str(ICA_RUN_ICASSO) + "\n"

    self.cache['logs'].append(printme + "\n")
    printme = ""

    if self.ICA_RUN_NUMBER == 1 :
        self.run = 1

        GlobalW_unmixer_X, sphere_X, \
              GlobalW_unmixer_Y, sphere_Y = pica_infomax7(self)

        weight_X = copy.copy(np.dot(GlobalW_unmixer_X, sphere_X))
        weight_Y = copy.copy(np.dot(GlobalW_unmixer_Y, sphere_Y))

        S_sources_X =    copy.copy(np.dot(weight_X, self.GlobalPCA_U_X))
        S_sources_Y =    copy.copy(np.dot(weight_Y, self.GlobalPCA_U_Y))

        GlobalA_mixer_X = copy.copy(pinv(weight_X))
        GlobalA_mixer_Y = copy.copy(pinv(weight_Y))

        np.savetxt(self.state['outputDirectory'] + "/ICA_GlobalA_mixer_X.csv", GlobalA_mixer_X, delimiter=",")
        np.savetxt(self.state['outputDirectory'] + "/ICA_S_sources_X.csv", S_sources_X, delimiter=",")
        np.savetxt(self.state['outputDirectory'] + "/ICA_GlobalW_unmixer_X.csv", GlobalW_unmixer_X, delimiter=",")

        np.savetxt(self.state['outputDirectory'] + "/ICA_GlobalA_mixer_Y.csv", GlobalA_mixer_Y, delimiter=",")
        np.savetxt(self.state['outputDirectory'] + "/ICA_S_sources_Y.csv", S_sources_Y, delimiter=",")
        np.savetxt(self.state['outputDirectory'] + "/ICA_GlobalW_unmixer_Y.csv", GlobalW_unmixer_Y, delimiter=",")


        LocalA_Corr_All_X = (local_reconstruction8(self, weight_X, GlobalA_mixer_X, \
            self.GlobalPCA_dewhite_X, self.Con_deWhite_X, self.NSUB_All_X, self.NCOM_All_X, SITE_NUM, B_GLOBAL, False))

        LocalA_Corr_All_Y = (local_reconstruction8(self, weight_Y, GlobalA_mixer_Y, \
            self.GlobalPCA_dewhite_Y, self.Con_deWhite_Y, self.NSUB_All_Y, self.NCOM_All_Y, SITE_NUM, B_GLOBAL, False))


        LocalA_Corr_A1_X = copy.copy(LocalA_Corr_All_X[:int(self.NSUB_All_X[0]), :]  )         # (63, 8)
        LocalA_Corr_A1_Y = copy.copy(LocalA_Corr_All_Y[:int(self.NSUB_All_Y[0]), :]  )         # (63, 8)

        if self.SITE_NUM == 2  :
            LocalA_Corr_A2_X = copy.copy(LocalA_Corr_All_X[int(self.NSUB_All_X[0]):(int(self.NSUB_All_X[0])+int(self.NSUB_All_X[1])), :]  )
            LocalA_Corr_A2_Y = copy.copy(LocalA_Corr_All_Y[int(self.NSUB_All_Y[0]):(int(self.NSUB_All_Y[0])+int(self.NSUB_All_Y[1])), :]  )




    elif self.ICA_RUN_NUMBER > 1 :
        b_infomax_creation = True
        if b_infomax_creation :

            weight_X_All = []
            S_sources_X_All = []
            sphere_X_All = []


            weight_Y_All = []
            S_sources_Y_All = []
            sphere_Y_All = []


            for run in range (self.ICA_RUN_NUMBER):
                self.run = run
                GlobalW_unmixer_X_1 , sphere_X_1, \
                    GlobalW_unmixer_Y_1, sphere_Y_1,= (pica_infomax7(self) )

                weight_X_1 = copy.copy(np.dot(GlobalW_unmixer_X_1, sphere_X_1) )
                weight_Y_1 = copy.copy(np.dot(GlobalW_unmixer_Y_1, sphere_Y_1) )
                S_sources_X_1 = copy.copy(np.dot(weight_X_1, self.GlobalPCA_U_X) )
                S_sources_Y_1 = copy.copy(np.dot(weight_Y_1, self.GlobalPCA_U_Y) )

                printme = printme + "run =" + str(run) + "\n"
                printme = printme + "weight_X_1.shape =" + str(np.array(weight_X_1).shape) + "\n"
                printme = printme + "S_sources_X_1.shape =" + str(np.array(S_sources_X_1).shape) + "\n"
                printme = printme + "weight_Y_1.shape =" + str(np.array(weight_Y_1).shape) + "\n"
                printme = printme + "S_sources_Y_1.shape =" + str(np.array(S_sources_Y_1).shape) + "\n"
                printme = printme + "\n"

                weight_X_All.append(weight_X_1)
                S_sources_X_All.append(S_sources_X_1)
                sphere_X_All.append(sphere_X_1)
                weight_Y_All.append(weight_Y_1)
                S_sources_Y_All.append(S_sources_Y_1)
                sphere_Y_All.append(sphere_Y_1)

                printme = printme + "weight_X_All.shape =" + str(np.array(weight_X_All).shape) + "\n"
                printme = printme + "S_sources_X_All.shape =" + str(np.array(S_sources_X_All).shape) + "\n"
                printme = printme + "weight_X_All[run,:,:].shape =" + str((np.array(weight_X_All)[run, :, :]).shape) + "\n"
                printme = printme + "S_sources_X_All[run,:,:].shape =" + str((np.array(S_sources_X_All)[run, :, :]).shape) + "\n"
                printme = printme + "weight_Y_All[run,:,:].shape =" + str((np.array(weight_Y_All)[run, :, :]).shape) + "\n"
                printme = printme + "S_sources_Y_All[run,:,:].shape =" + str((np.array(S_sources_Y_All)[run, :, :]).shape) + "\n"

            # end of for

            printme = printme + "\n"

        self.cache['logs'].append(printme + "\n")
        printme = ""

        if ICA_RUN_AVERAGE :
            printme = printme + "[LOG][Flow_8b_Parallel_ICA-Global] Multi-run ICA AVERAGE of " + str(self.ICA_RUN_NUMBER) + \
                      " X run. Start." + "\n"
            self.cache['logs'].append(printme + "\n")
            printme = ""

            GlobalA_mixer_X, S_sources_X, GlobalW_unmixer_X \
                = pica_infomax_run_average5(self, "X", self.ICA_RUN_NUMBER, self.GlobalPCA_U_X , \
                        weight_X_All, S_sources_X_All )
            printme = printme + "[LOG][Flow_8b_Parallel_ICA-Global] Multi-run ICA AVERAGE of " + str(self.ICA_RUN_NUMBER) + \
                      " X run. Finish." + "\n"
            self.cache['logs'].append(printme + "\n")
            printme = ""

            printme = printme + "[LOG][Flow_8b_Parallel_ICA-Global] Multi-run ICA AVERAGE of " + str(self.ICA_RUN_NUMBER) + \
                      " Y run. Start." + "\n"
            self.cache['logs'].append(printme + "\n")
            printme = ""

            GlobalA_mixer_Y, S_sources_Y, GlobalW_unmixer_Y \
                = pica_infomax_run_average5(self, "Y", self.ICA_RUN_NUMBER, self.GlobalPCA_U_Y , \
                        weight_Y_All, S_sources_Y_All )

            printme = printme + "[LOG][Flow_8b_Parallel_ICA-Global] Multi-run ICA AVERAGE of " + str(self.ICA_RUN_NUMBER) + \
                      " Y run. Finish." + "\n"
            self.cache['logs'].append(printme + "\n")
            printme = ""


        if ICA_RUN_ICASSO :
            printme = printme + "[LOG][Flow_8b_Parallel_ICA-Global] Multi-run ICA ICASSO of " + str(self.run) + \
                        " X run. Start." + "\n"
            self.cache['logs'].append(printme + "\n")
            printme = ""

            GlobalA_mixer_X, S_sources_X, GlobalW_unmixer_X \
                = pica_infomax_run_icasso6(self, "X", self.ICA_RUN_NUMBER, self.GlobalPCA_U_X , \
                        weight_X_All, S_sources_X_All )
            printme = printme + "[LOG][Flow_8b_Parallel_ICA-Global] Multi-run ICA ICASSO of " + str(self.run) + \
                        " X run. Finish." + "\n"


            printme = printme + "[LOG][Flow_8b_Parallel_ICA-Global] Multi-run ICA ICASSO of " + str(self.run) + \
                        " Y run. Start." + "\n"
            self.cache['logs'].append(printme + "\n")
            printme = ""

            GlobalA_mixer_Y, S_sources_Y, GlobalW_unmixer_Y \
                = pica_infomax_run_icasso6(self, "Y", ICA_RUN_NUMBER, self.GlobalPCA_U_Y , \
                        weight_Y_All, S_sources_Y_All )
            printme = printme + "[LOG][Flow_8b_Parallel_ICA-Global] Multi-run ICA ICASSO of " + str(self.run) + \
                        " Y run. Finish." + "\n"


        np.savetxt(self.state['outputDirectory'] + "/ICA_GlobalA_mixer_X.csv", GlobalA_mixer_X, delimiter=",")
        np.savetxt(self.state['outputDirectory'] + "/ICA_S_sources_X.csv", S_sources_X, delimiter=",")
        np.savetxt(self.state['outputDirectory'] + "/ICA_GlobalW_unmixer_X.csv", GlobalW_unmixer_X, delimiter=",")

        np.savetxt(self.state['outputDirectory'] + "/ICA_GlobalA_mixer_Y.csv", GlobalA_mixer_Y, delimiter=",")
        np.savetxt(self.state['outputDirectory'] + "/ICA_S_sources_Y.csv", S_sources_Y, delimiter=",")
        np.savetxt(self.state['outputDirectory'] + "/ICA_GlobalW_unmixer_Y.csv", GlobalW_unmixer_Y, delimiter=",")



        LocalA_Corr_All_X = (local_reconstruction8(self, GlobalW_unmixer_X, GlobalA_mixer_X, \
            self.GlobalPCA_dewhite_X, self.Con_deWhite_X, self.NSUB_All_X, self.NCOM_All_X, SITE_NUM, B_GLOBAL, False))

        LocalA_Corr_All_Y = (local_reconstruction8(self, GlobalW_unmixer_Y, GlobalA_mixer_Y, \
            self.GlobalPCA_dewhite_Y, self.Con_deWhite_Y, self.NSUB_All_Y, self.NCOM_All_Y, SITE_NUM, B_GLOBAL, False))


        LocalA_Corr_A1_X = copy.copy(LocalA_Corr_All_X[:int(self.NSUB_All_X[0]), :]  )         # (63, 8)
        LocalA_Corr_A1_Y = copy.copy(LocalA_Corr_All_Y[:int(self.NSUB_All_Y[0]), :]  )         # (63, 8)

        if self.SITE_NUM == 2  :
            LocalA_Corr_A2_X = copy.copy(LocalA_Corr_All_X[int(self.NSUB_All_X[0]):(int(self.NSUB_All_X[0])+int(self.NSUB_All_X[1])), :]  )
            LocalA_Corr_A2_Y = copy.copy(LocalA_Corr_All_Y[int(self.NSUB_All_Y[0]):(int(self.NSUB_All_Y[0])+int(self.NSUB_All_Y[1])), :]  )





    printme = printme + "[LOG][Flow_9_Looping the next iteration of Global ICA (Finding W) via Infomax and pICA (Finding ∆A)]. Finish." + "\n"

    printme = printme + "[LOG][Flow_10_Report_correlation_data-Local_reconstruction]=====Modality_X : Find local A using GlobalPCA_dewhite_X and Con_deWhite_X   =====" + "\n"
    printme = printme + "[LOG][Flow_10_Report_correlation_data-Local_reconstruction]=====Modality_Y : Find local A using GlobalPCA_dewhite_Y and Con_deWhite_Y   =====" + "\n"

    printme = printme + "[LOG][Flow_10_Report]=====Print all Modality shape=====" + "\n"
    printme = printme + "Modality_X === GlobalA_mixer_X.shape (r_X x r_X) = " + str(GlobalA_mixer_X.shape) + \
        "S_sources_X (r_X x d_X) = " + str(S_sources_X.shape) +  \
        "GlobalW_unmixer_X (r_X x r_X ) = " + str(GlobalW_unmixer_X.shape) + "\n"
    printme = printme + "Modality_Y === GlobalA_mixer_Y.shape (r_Y x r_Y) = " + str(GlobalA_mixer_Y.shape) + \
        "S_sources_Y (r_Y x d_Y) = " +  str(S_sources_Y.shape) + \
        "GlobalW_unmixer_Y (r_Y x r_Y ) = " + str(GlobalW_unmixer_Y.shape) + "\n"

    # Report correlation data - Local reconstruction

    printme = printme + "[LOG][Flow_10_Report_correlation_data-Local_reconstruction]=====Start=====" + "\n"

    # Report_correlation_data- Find local A using GlobalPCA_dewhite_X and Con_deWhite_X
    # Called Local-reconstruction from-Global-to-Local


    printme = printme + "[LOG][Flow_10_Report_correlation_data-Local_reconstruction]=====Print all Modality local A shape=====" + "\n"
    printme = printme + "Modality_X === LocalA_Corr_A1_X (sN_X x r_X)" + str(LocalA_Corr_A1_X.shape) + "\n"
    printme = printme + "Modality_Y === LocalA_Corr_A1_Y (sN_Y x r_Y)" + str(LocalA_Corr_A1_Y.shape) + "\n"
    if SITE_NUM == 2  :
        printme = printme + "Modality_X === LocalA_Corr_A2_X (sN_X x r_X)" + str(LocalA_Corr_A2_X.shape) + "\n"
        printme = printme + "Modality_Y === LocalA_Corr_A2_Y (sN_Y x r_Y)" + str(LocalA_Corr_A2_Y.shape) + "\n"

    printme = printme + "[LOG][Flow_10_Report_correlation_data-Local_reconstruction]=====Finish=====" + "\n"



    # Save S_X, S_Y, local_A_X, and local_A_Y
    np.savetxt(self.state['outputDirectory'] + "/GlobalA_mixer_X.csv", GlobalA_mixer_X, delimiter=",")
    np.savetxt(self.state['outputDirectory'] + "/S_sources_X.csv", S_sources_X, delimiter=",")
    np.savetxt(self.state['outputDirectory'] + "/GlobalW_unmixer_X.csv", GlobalW_unmixer_X, delimiter=",")
    np.savetxt(self.state['outputDirectory'] + "/GlobalA_mixer_Y.csv", GlobalA_mixer_Y, delimiter=",")
    np.savetxt(self.state['outputDirectory'] + "/S_sources_Y.csv", S_sources_Y, delimiter=",")
    np.savetxt(self.state['outputDirectory'] + "/GlobalW_unmixer_Y.csv", GlobalW_unmixer_Y, delimiter=",")

    # 1 site
    np.savetxt(self.state['outputDirectory'] + "/LocalA_Corr_A1_X.csv", LocalA_Corr_A1_X, delimiter=",")
    np.savetxt(self.state['outputDirectory'] + "/LocalA_Corr_A1_Y.csv", LocalA_Corr_A1_Y, delimiter=",")
    if SITE_NUM == 2 :
        np.savetxt(self.state['outputDirectory'] + "/LocalA_Corr_A2_X.csv", LocalA_Corr_A2_X, delimiter=",")
        np.savetxt(self.state['outputDirectory'] + "/LocalA_Corr_A2_Y.csv", LocalA_Corr_A2_Y, delimiter=",")

    np.savetxt(self.state['outputDirectory'] + "/mymaxcorr_list.csv", self.mymaxcorr_list, delimiter=",")
    np.savetxt(self.state['outputDirectory'] + "/myentropy_list_X.csv", self.myentropy_list_X, delimiter=",")
    np.savetxt(self.state['outputDirectory'] + "/myentropy_list_Y.csv", self.myentropy_list_Y, delimiter=",")
    np.savetxt(self.state['outputDirectory'] + "/mySTEP_list_X.csv", self.mySTEP_list_X, delimiter=",")
    np.savetxt(self.state['outputDirectory'] + "/mySTEP_list_Y.csv", self.mySTEP_list_Y, delimiter=",")

    printme = printme + "======================================" + "\n"
    printme = printme + "======================================" + "\n"
    printme = printme + "DATA_PATH_OUTPUT = " + str(self.state['outputDirectory']) + "\n"
    printme = printme + "maxcorr = " + str(self.mymaxcorr_list) + "\n"
    printme = printme + "ENTROPY_X =  " + str(self.myentropy_list_X) + "\n"
    printme = printme + "ENTROPY_Y =  " + str(self.myentropy_list_Y) + "\n"
    printme = printme + "STEP_X =  " + str(self.mySTEP_list_X) + "\n"
    printme = printme + "STEP_Y =  " + str(self.mySTEP_list_Y) + "\n"
    printme = printme + "======================================" + "\n"
    printme = printme + "======================================" + "\n"

    self.cache['logs'].append(printme + "\n")

    return (self)

def dpICA_local_pca(self):
    #
    # Local PCA start
    #
    printme = ""
    printme = printme + "[LOG][Flow_2_Local_PCA]=====Start====="  + "\n"

    self.U_X1, self.L_white_X1, self.L_dewhite_X1 = pca_whiten7(self.clean_data_X1, self.NCOM_X1, False, False) #Remove mean
    self.U_Y1, self.L_white_Y1, self.L_dewhite_Y1 = pca_whiten7(self.clean_data_Y1, self.NCOM_Y1, True, False) #Keep mean

    np.savetxt( self.state['outputDirectory'] + "/U_X1.csv", self.U_X1, delimiter=",")
    np.savetxt( self.state['outputDirectory'] + "/L_white_X1.csv", self.L_white_X1, delimiter=",")
    np.savetxt( self.state['outputDirectory'] + "/L_dewhite_X1.csv", self.L_dewhite_X1, delimiter=",")
    np.savetxt( self.state['transferDirectory'] + "/U_X1.csv", self.U_X1, delimiter=",")
    np.savetxt( self.state['transferDirectory'] + "/L_white_X1.csv", self.L_white_X1, delimiter=",")
    np.savetxt( self.state['transferDirectory'] + "/L_dewhite_X1.csv", self.L_dewhite_X1, delimiter=",")

    np.savetxt( self.state['outputDirectory'] + "/U_Y1.csv", self.U_Y1, delimiter=",")
    np.savetxt( self.state['outputDirectory'] + "/L_white_Y1.csv", self.L_white_Y1, delimiter=",")
    np.savetxt( self.state['outputDirectory'] + "/L_dewhite_Y1.csv", self.L_dewhite_Y1, delimiter=",")
    np.savetxt( self.state['transferDirectory'] + "/U_Y1.csv", self.U_Y1, delimiter=",")
    np.savetxt( self.state['transferDirectory'] + "/L_white_Y1.csv", self.L_white_Y1, delimiter=",")
    np.savetxt( self.state['transferDirectory'] + "/L_dewhite_Y1.csv", self.L_dewhite_Y1, delimiter=",")

    # Print all Modality Local PCA shape
    printme = printme + "Modality_X1 === U_X1.shape (r_X1 x d_X1)" + str(self.U_X1.shape ) + \
              "L_white_X1 (r_X1 x N_X1) = "  + str(self.L_white_X1.shape) + \
              "L_dewhite_X1 (N_X1 x r_X1 ) = " + str(self.L_dewhite_X1.shape) + "\n"

    printme = printme + "Modality_Y1 === U_Y1.shape (r_Y1 x d_Y1)" + str(self.U_Y1.shape ) + \
              "L_white_Y1 (r_Y1 x N_Y1) = "  + str(self.L_white_Y1.shape) + \
              "L_dewhite_X1 (N_Y1 x r_Y1 ) = " + str(self.L_dewhite_Y1.shape) + "\n"

    printme = printme + "[LOG][Flow_2_Local_PCA]=====End====="  + "\n"
    self.cache['logs'].append(printme + "\n")

    return 0

def dpICA_global_pca(self):
    #
    # Global PCA start
    #
    printme = ""
    printme = printme + "[LOG][Flow_4_Global_PCA]=====Start====="  + "\n"

    # Global PCA of reach Modality
    printme = printme + "[LOG][Flow_4_Global_PCA]=====Global PCA of Modality_X and Modality_Y====="  + "\n"

    if not (B_GLOBAL) :
        self.GlobalPCA_U_X = copy.copy(self.Global_U_X)
        self.GlobalPCA_U_Y = copy.copy(self.Global_U_Y)
        self.GlobalPCA_White_X = copy.copy(self.Con_White_X)
        self.GlobalPCA_White_Y = copy.copy(self.Con_White_Y)
        self.GlobalPCA_dewhite_X = copy.copy(self.Con_deWhite_X)
        self.GlobalPCA_dewhite_Y = copy.copy(self.Con_deWhite_Y)


    if B_GLOBAL :
        self.GlobalPCA_U_X, self.GlobalPCA_White_X, self.GlobalPCA_dewhite_X  = pca_whiten7(self.Global_U_X, \
                                                            self.Global_NCOM_X, True, True) #Keep mean and DO whitening

        self.GlobalPCA_U_Y, self.GlobalPCA_White_Y, self.GlobalPCA_dewhite_Y = pca_whiten7(self.Global_U_Y, \
                                                            self.Global_NCOM_Y, True, True)  # Keep mean and DO whitening

    printme = printme + "\n"

    # Print all Modality Global PCA shape
    printme = printme + "Modality_X === GlobalPCA_U_X.shape (r_X x d_X)" +  str(self.GlobalPCA_U_X.shape) + \
        "GlobalPCA_White_X (r_X x sr_X) = " +  str(self.GlobalPCA_White_X.shape) +  \
        "GlobalPCA_dewhite_X (sr_X x r_X ) = " + str(self.GlobalPCA_dewhite_X.shape)  + "\n"

    printme = printme + "Modality_Y === GlobalPCA_U_Y.shape (r_Y x d_Y)" +  str(self.GlobalPCA_U_Y.shape) + \
        "GlobalPCA_White_Y (r_Y x sr_Y) = " +  str(self.GlobalPCA_White_Y.shape) +  \
        "GlobalPCA_dewhite_Y (sr_Y x r_Y ) = " + str(self.GlobalPCA_dewhite_Y.shape)  + "\n"

    np.savetxt( self.state['outputDirectory'] + "/GlobalPCA_U_X.csv", self.GlobalPCA_U_X, delimiter=",")
    np.savetxt( self.state['outputDirectory'] + "/GlobalPCA_White_X.csv", self.GlobalPCA_White_X, delimiter=",")
    np.savetxt( self.state['outputDirectory'] + "/GlobalPCA_dewhite_X.csv", self.GlobalPCA_dewhite_X, delimiter=",")

    np.savetxt( self.state['outputDirectory'] + "/GlobalPCA_U_Y.csv", self.GlobalPCA_U_Y, delimiter=",")
    np.savetxt( self.state['outputDirectory'] + "/GlobalPCA_White_Y.csv", self.GlobalPCA_White_Y, delimiter=",")
    np.savetxt( self.state['outputDirectory'] + "/GlobalPCA_dewhite_Y.csv", self.GlobalPCA_dewhite_Y, delimiter=",")


    printme = printme + "[LOG][Flow_4_Global_PCA]=====End=====" + "\n"
    self.cache['logs'].append(printme + "\n")

    return 0

def dpica_local_methods(self):

    self.cache['logs'].append('==dpica_local_methods starting==' + "\n")
    a = setUp(self)
    b = local_setUp(self)
    c = dpICA_local_pca(self)
    self.cache['logs'].append('==dpica_local_methods completed.==' + "\n")

    return 0

def dpica_global_methods(self):

    self.cache['logs'].append('==dpica_global_methods starting==' + "\n")
    a = setUp(self)
    b = global_setUp(self)
    c = dpICA_global_pca(self)
    self.cache['logs'].append('==dpica_global_methods completed==' + "\n")

    return 0

def diagsqrts(w):
    """
    Returns direct and inverse square root normalization matrices
    """
    Di = np.diag(1. / (np.sqrt(w) + np.finfo(float).eps))
    D = np.diag(np.sqrt(w))
    return D, Di

def pca_whiten7(x2d_input, n_comp, b_mean, b_normalize):    
    """ data Whitening  ==> pca_whiten6 is pca_whiten3 without whitening.
    *Input
    x2d : 2d data matrix of observations by variables
    n_comp: Number of components to retain
    b_mean : To decide to remove mean if False
    b_normalize : to decide to whitening if True
    *Output
    Xwhite : Whitened X
    white : whitening matrix (Xwhite = np.dot(white,X))
    dewhite : dewhitening matrix (X = np.dot(dewhite,Xwhite))
    """

    if b_mean :     # Keep mean
        x2d = x2d_input
    else :          # Remove mean
        x2d = x2d_input - x2d_input.mean(axis=1).reshape((-1, 1))
        
    NSUB, NVOX = x2d.shape
    if NSUB > NVOX:
        cov = np.dot(x2d.T, x2d) / (NSUB - 1)    
        w, v = eigh(cov, eigvals=(NVOX - n_comp, NVOX - 1))    
        D, Di = diagsqrts(w)
        u = np.dot(dot(x2d, v), Di)
        x_white = v.T
        white = np.dot(Di, u.T)
        dewhite = np.dot(u, D)
    else:
        cov = np.dot(x2d, x2d.T) / (NVOX - 1)
        w, u = eigh(cov, eigvals = (NSUB - n_comp, NSUB - 1))
        # w eigenvalue rx1
        # u eigenvector Nxr
        if b_normalize :
            # diagsqrts(w)=D rxr
            D, Di = diagsqrts(w) # Return direct and inverse square root normalization matrices
            white = np.dot(Di, u.T)
            x_white = np.dot(white, x2d)
            dewhite = np.dot(u, D)
        else :       
            white = u.T
            x_white = np.dot(white, x2d) # c
            dewhite = u
    return (x_white, white, dewhite)

def weight_update4(weights, x_white, bias1, lrate1, b_exp):
    """ Update rule for infomax
    This function recieves parameters to update W1
    * Input
    weights : unmixing matrix (must be a square matrix)
    x_white: whitened data
    bias1: current estimated bias
    lrate1: current learning rate
    b_exp : experiment 

    * Output
    weights : updated mixing matrix
    bias: updated bias
    lrate1: updated learning rate
    """
    NCOMP, NVOX = (x_white.shape)
    block1 = (int(np.floor(np.sqrt(NVOX / 3))))
    last1 = (int(np.fix((NVOX/block1-1)*block1+1)))

    if not b_exp :
        permute1 = permutation(NVOX) 
    else :
        permute1 = range(NVOX)
    for start in range(0, last1, block1):
        if start + block1 < NVOX:
            tt2 = (start + block1 )

        else:
            tt2 = (NVOX)
            block1 = (NVOX - start)
        
        unmixed = (np.dot(weights, x_white[:, permute1[start:tt2]]) + bias1)
        logit = 1 / (1 + np.exp(-unmixed))
        weights = (weights + lrate1 * np.dot( 
            block1 * np.eye(NCOMP) + np.dot( (1-2*logit), unmixed.T), weights))

        bias1 = (bias1 + lrate1 * (1-2*logit).sum(axis=1).reshape(bias1.shape))
        # Checking if W blows up

        if (np.isnan(weights)).any() or np.max(np.abs(weights)) > MAX_WEIGHT:
            # ("Weight is outside the range. Restarting.")
            weights = (np.eye(NCOMP))
            bias1 = (np.zeros((NCOMP, 1)))
            error = 1
           
            if lrate1 > 1e-6 and \
            matrix_rank(x_white) < NCOMP:
                a = 1
                # ("Data 1 is rank defficient"
                #     ". I cannot compute " +
                #     str(NCOMP) + " components.")
                return (None, None, None, 1)

            if lrate1 < 1e-6:
                a = 1
                # ("Weight matrix may"
                #     " not be invertible...")
                return (None, None, None, 1)

            break
        else:
            error = 0

    return (weights, bias1, lrate1, error)

def ica_fuse_falsemaxdetect(self, data, trendPara, LtrendPara = 0.0):


        if  trendPara is None: 
            LtrendPara= 1e-4
            trendPara= -1e-3
        elif LtrendPara == 0.0 :
            LtrendPara= 1e-4
        # end if

        if not (LtrendPara) :
            LtrendPara = 0.0001 
        if not (trendPara) :
            trendPara= -0.001
        
        Overindex = 0

        n = np.count_nonzero(data)

        if  n > 60 :
            x = np.arange(50)
            y = data[n-49:n+1] 
            y = data[n-49:n+1] - np.mean(data[n-49:n+1])
            p = np.polyfit(x,y,1)            

            if abs(p[0]) < LtrendPara :
                Overindex = 1
            # end if
        # end if

        if not Overindex : 
            x = np.arange(5)       
            y = data[n-4:n+1]      
            y = data[n-4:n+1] - np.mean(data[n-4:n+1])
            p = np.polyfit(x,y,1)
            if p[0] < trendPara :
                    Overindex = 1
            # end if        
        # end if

        return (Overindex)

def ica_fuse_corr(self, x, y):  # x (48,8) y (48,8)
    # Linear or rank correlation

    if not ('y' in locals() ):
        y = x
        [ny1, ny2] = y.shape     
    else :
        ny2 = y.shape[1] 
    
    # Check dimensions of x and y
    if (x.shape[0] != y.shape[0] ) :
        a = 1
        # ('X and Y must have the same number of rows.')
    # end if

    [nx1, nx2] = x.shape

    # Initialise pairwise correlation
    c = np.zeros((nx2, ny2))

    for ii in range(0,nx2):
        for jj in range(0,ny2):
            x_ii = x[:, ii]
            y_jj = y[:, jj]
            c[ii, jj] = ica_fuse_corr2(self, x[:, ii], y[:, jj])
    # End loop over rows

    return c

def ica_fuse_corr2(self, x, y): # x 43x1   y = 43x1
    # computes correlation coefficient
    meanX = np.mean(x)
    meanY = np.mean(y)

    # Remove mean
    x = x - meanX
    y = y - meanY

    corr_coeff = np.sum(np.sum(x*y, axis=0)) / math.sqrt(np.sum(np.sum(x*x)) * np.sum(np.sum(y*y)))

    return corr_coeff

def find_argmax_v2( coef_1_2, axis_input=1): # 
    # Calculate the indices of the maximum values along an axis
    # Input :
    #  - coef_1_2 : corrcoef between matrix 1 and matrix 2
    #  - axis_input : By default, the index is into the flattened array, otherwise along the specified axis. Default = 1 is by row.
    # Output :
    #  - max_index_row : maximum values along an axis

    NCOMP = coef_1_2.shape[0]
    Corr_matrix = abs(coef_1_2)
    coef_max_index_array = np.zeros(NCOMP).astype(int)
    for i in range(NCOMP) :        
        amax  = np.amax(Corr_matrix)
        amax_index = np.where(Corr_matrix == amax)
        amax_row = amax_index[0]
        amax_column = amax_index[1]
        amax_row = amax_row[0]
        amax_column = amax_column[0]

        if axis_input == 1 : 
            coef_max_index_array[amax_row] = int(amax_column)
        elif axis_input == 0 :                     
            coef_max_index_array[amax_column] = int(amax_row)
        Corr_matrix[amax_row,:] = 0
        Corr_matrix[:,amax_column] = 0

    return coef_max_index_array   #

def pica_infomax_run_average5(self, XY, num_ica_runs, GlobalPCA_U,  w, s):    
    """Computes average ICA 
    *Input
        w : Globa W unmixer matrix from Infomax (r x r) or (components x components)
        s : Source matrix from Infomax (r x d) or (components x variable voxel)
        num_ica_runs : Number of times to run ica    
        XY  : Modality X or Y
    *Output
        A : GlobalA_mixer_X : mixing matrix
        S : S_sources_X : source matrix
        W : GlobalW_unmixer : unmixing matrix
    """

    NCOMP, r = np.array(w)[0,:,:].shape
    coef_All = []
    w_ordered_All = []
    s_ordered_All = []
    coef_s0_sj_ordered_All = []
    printme = ""

    #########################
    # Normalizing
    #########################
    # Normalize weight_All by removing mean and by removing standard deviation of the array
    printme = printme + "[LOG][Multirun ICA] De-mean " + "\n"

    #########################
    # Clustering
    #########################
    # Using the ordered cross-correlation algorithm
    printme = printme + "[LOG][Multirun ICA] Clustering " + "\n"
    data_path_save = self.state['outputDirectory'] + os.sep
    # Define w0 index 
    w0_ordered = np.array(w)[0,:,:]
    s0_ordered = np.array(s)[0,:,:]
    w_ordered_All.append(w0_ordered)
    s_ordered_All.append(s0_ordered)

    for j in range (1, num_ica_runs):
        # Finding correlation from Source matrix
        w1 = np.array(w)[j,:,:]
        s1 = np.array(s)[j,:,:]        
        data_file_save = "Correlation_Graph_"  + XY + "_s0_s" + str(j) + ".jpeg"
        coef_s0_sj = dpica_report.pica_2d_correlate7(s0_ordered, s1, data_path_save, data_file_save, True, False, True)    
        coef_All.append(coef_s0_sj)

        # Finding numximum pair index from Source matrix
        max_index_row = find_argmax_v2(coef_s0_sj, 1) 
        w1_ordered = w1[max_index_row,:]        # Rearrange w1 in max_index_row(w0) order.
        s1_ordered = s1[max_index_row,:]        # Rearrange s1 in max_index_row(w0) order.
        data_file_save = "Correlation_Graph_"  + XY + "_s0_s" + str(j) + "_ordered.jpeg"
        coef_s0_sj_ordered = dpica_report.pica_2d_correlate7(s0_ordered, s1_ordered, data_path_save, data_file_save, True, False, True)     
        w_ordered_All.append(w1_ordered)
        s_ordered_All.append(s1_ordered)
        coef_s0_sj_ordered_All.append(coef_s0_sj_ordered)

    # end of for

    printme = printme + "[LOG][Multirun ICA] Clustering - Finish" + "\n"

    #########################
    # Re-arrange  positive/negative pattern
    #########################
    # Using the -1 algorithm (not absolute algorithm)
    printme = printme + "[LOG][Multirun ICA] Re-arranging - pattern" + "\n"


    for i in range(NCOMP) :
        ## Switch current row to opposite sign
        for j in range (1, num_ica_runs):
            coef_s0_sj_ordered = np.array(coef_s0_sj_ordered_All)[j-1,:,:]
            w_ordered = np.array(w_ordered_All)[j,:,:]  
            if coef_s0_sj_ordered[i,i] < 0 : 
                w_ordered[i] = -1 * w_ordered[i]
                printme = printme + "[LOG][Multirun ICA] Re-arranging - Component " + \
                          str(i) + "of w" + str(j) + "_[" + str(i) + "] is applied -1 as coef_s0_s" + \
                          str(j) + " =" +  str(coef_s0_sj_ordered[i,i])  + "\n"
            # end of if
        # end of for j loop
    # end of for i loop


    # End or for i loop.

    # Save each Weight Correlation matrix
    for j in range (1, num_ica_runs):
        w_ordered = np.array(w_ordered_All)[j,:,:]  
        data_file_save =  "Correlation_Graph_"  + XY + "_w0_w" + str(j) + "_ordered_flipped.jpeg"   
        coef_w0_wj_ordered = dpica_report.pica_2d_correlate7(w0_ordered, w_ordered, data_path_save, data_file_save, True, False, True)

    # End or for j loop.

    printme = printme + "[LOG][Multirun ICA] Re-arranging - Finished" + "\n"


    #########################
    # Computing the final weight W
    #########################
    # Using the Average algorithm
    printme = printme + "[LOG][Multirun ICA] Average algorithm" + "\n"


    w_ordered_All = np.array(w_ordered_All)

    # Compute GlobalA 
    GlobalW_unmixer = np.average(w_ordered_All, axis=0)
    printme = printme + "[LOG][Multirun ICA] Average algorithm - Done" + "\n"

    # Compute GlobalA_mixer and S_source
    GlobalA_mixer = inv(GlobalW_unmixer)     
    S_sources = np.dot(GlobalW_unmixer, GlobalPCA_U)

    self.cache['logs'].append(printme + "\n")

    return (GlobalA_mixer, S_sources, GlobalW_unmixer)

def pica_infomax_run_icasso6(self, XY,  num_ica_runs, GlobalPCA_U,  w, s):   
    """Computes ICASSO ICA with find_argmax function
    *Input
        w : Globa W unmixer matrix from Infomax (r x r) or (components x components)
        s : Source matrix from Infomax (r x d) or (components x variable voxel)
        num_ica_runs : Number of times to run ica    
        XY  : Modality X or Y
    *Output
        A : GlobalA_mixer_X : mixing matrix
        S : S_sources_X : source matrix
        W : GlobalW_unmixer : unmixing matrix
    """
    NCOMP, r = np.array(w)[0,:,:].shape
    coef_All = []
    w_ordered_All = []
    s_ordered_All = []
    coef_s0_sj_ordered_All = []
    printme = ""

    #########################
    # Normalizing
    #########################
    # Normalize m1, m2, m3, m4, m5 by removing mean and by removing standard deviation of the array
    printme = printme + "[LOG][Multirun ICA] De-mean " + "\n"

    #########################
    # Clustering
    #########################
    # Using the ordered cross-correlation algorithm
    printme = printme + "[LOG][Multirun ICA] Clustering " + "\n"
    data_path_save = self.state['outputDirectory']
    # Define w0 index
    w0_ordered = np.array(w)[0,:,:]
    s0_ordered = np.array(s)[0,:,:]
    w_ordered_All.append(w0_ordered)
    s_ordered_All.append(s0_ordered)

    for j in range (1, num_ica_runs):
        # Finding correlation from Source matrix
        w1 = np.array(w)[j,:,:]
        s1 = np.array(s)[j,:,:]        
        data_file_save =  "Correlation_Graph_"  + XY + "_s0_s" + str(j) + ".jpeg"    
        coef_s0_sj = dpica_report.pica_2d_correlate7(s0_ordered, s1, data_path_save, data_file_save, True, False, True)    
        coef_All.append(coef_s0_sj)

        # Finding numximum pair index from Source matrix
        max_index_row = find_argmax_v2(coef_s0_sj, 1) 
        w1_ordered = w1[max_index_row,:]        # Rearrange w1 in max_index_row(w0) order.
        s1_ordered = s1[max_index_row,:]        # Rearrange s1 in max_index_row(w0) order.
        data_file_save =  "Correlation_Graph_"  + XY + "_s0_s" + str(j) + "_ordered.jpeg"     
        coef_s0_sj_ordered = dpica_report.pica_2d_correlate7(s0_ordered, s1_ordered, data_path_save, data_file_save, True, False, True)     
        w_ordered_All.append(w1_ordered)
        s_ordered_All.append(s1_ordered)
        coef_s0_sj_ordered_All.append(coef_s0_sj_ordered)

    # end of for



    printme = printme + "[LOG][Multirun ICA] Clustering - Finish" + "\n"


    #########################
    # Re-arrange  positive/negative pattern
    #########################
    # Using the -1 algorithm (not absolute algorithm)
    printme = printme + "[LOG][Multirun ICA] Re-arranging - pattern" + "\n"


    for i in range(NCOMP) :
        ## Switch current row to opposite sign
        for j in range (1, num_ica_runs):
            coef_s0_sj_ordered = np.array(coef_s0_sj_ordered_All)[j-1,:,:]
            w_ordered = np.array(w_ordered_All)[j,:,:]  
            if coef_s0_sj_ordered[i,i] < 0 : 
                w_ordered[i] = -1 * w_ordered[i]
                printme = printme + "[LOG][Multirun ICA] Re-arranging - Component " + \
                          str(i) + "of w" + str(j) + "_[" + str(i) + "] is applied -1 as coef_s0_s" + \
                          str(j) + " =" +  str(coef_s0_sj_ordered[i,i])  + "\n"
            # end of if
        # end of for j loop
    # end of for i loop

    # Save each Weight Correlation matrix
    for j in range (1, num_ica_runs):
        w_ordered = np.array(w_ordered_All)[j,:,:]  
        data_file_save =  "Correlation_Graph_"  + XY + "_w0_w" + str(j) + "_ordered_flipped.jpeg"   
        coef_w0_wj_ordered = dpica_report.pica_2d_correlate7(w0_ordered, w_ordered, data_path_save, data_file_save, True, False, True)
    # End or for j loop.

    printme = printme + "[LOG][Multirun ICA] Re-arranging - Finished" + "\n"


    #########################
    # Computing the final weight W
    #########################
    # Using the Centrotype algorithm
    printme = printme + "[LOG][Multirun ICA] Centrotype algorithm" + "\n"

    GlobalW_unmixer = []
    list_m = []


    for i in range(NCOMP) :        
        coef_max_sum_list = []
        coef_max_sum = -9999
        printme = printme + "[LOG][Multirun ICA] Centrotype - Component " + \
                  str(i) + "========================" + "\n"

        for j in range(num_ica_runs) : 
            for k in range(num_ica_runs) : 
                if j != k and j < k:
                    w_j_ordered = np.array(w_ordered_All)[j,:,:]  
                    w_k_ordered = np.array(w_ordered_All)[k,:,:]  

                    data_file_save =  "Correlation_Graph_"  + XY + "_ICASSO_component_" + str(i) + "_w" + str(j) + "_w" + str(k) + ".jpeg"   
                    coef_component = dpica_report.pica_2d_correlate6(w_j_ordered[i], w_k_ordered[i], data_path_save, data_file_save, False, False, True)           
                    coef_component_wj_wk = np.corrcoef ( w_j_ordered[i], w_k_ordered[i])        
                    coef_component_wj_wk_sum = np.sum(coef_component_wj_wk[0,1])
                    printme = printme + "[LOG][Multirun ICA] Centrotype - Component " + \
                            str(i) + " coef_component_w" + str(j) + "_w" + str(k) + "_sum = " + \
                            str(coef_component_wj_wk_sum) + "\n"

                    if coef_component_wj_wk_sum > coef_max_sum :
                            coef_max_sum_list = w_k_ordered[i]
                            coef_max_sum = coef_component_wj_wk_sum
                            printme = printme + "[LOG][Multirun ICA] Centrotype - Component " + \
                                str(i) + "w" + str(j) + "_w" + str(k) + "_coef_max_sum = " + \
                                str(coef_max_sum) + "\n"

                    # end if w_j Vs w_k

        list_m.append(coef_max_sum_list)
        printme = printme + "[LOG][Multirun ICA] Centrotype - Component " + str(i) + \
                  "list_m = " + str(len(list_m)) +  "." + "\n"
        printme = printme + "[LOG][Multirun ICA] Centrotype - Component " + str(i) + \
                    "========================" + "\n"


    # End or for loop.


    # Compute GlobalA 
    GlobalW_unmixer = np.array(list_m)

    printme = printme + "[LOG][Multirun ICA] Centrotype algorithm - Done" + "\n"

    # Compute GlobalA_mixer and S_source
    GlobalA_mixer = inv(GlobalW_unmixer)     
    S_sources = np.dot(GlobalW_unmixer, GlobalPCA_U)       

    self.cache['logs'].append(printme + "\n")

    return (GlobalA_mixer, S_sources, GlobalW_unmixer)

def findsteplength1(fk, deltafk, x1, x2, alphak, P, c1, c2):

    # Initialization    
    con = 1
    coml = len(x1)

    while (con) and (con < 100) :
        xnew = x1 + alphak * P
        fk0 = np.corrcoef(xnew, x2)
        fk1 = - fk0[ 0, 1] ** 2
        tcov_dot = np.dot((xnew - np.mean(xnew)) , (x2 - np.mean(x2)).T)
        tcov_dot_coml = tcov_dot /    (coml-1)
        tcov = tcov_dot_coml

        comterm = 2*(tcov)/np.var(xnew,ddof=1)/np.var(x2,ddof=1)
        deltafk1 = -comterm*(x2-np.mean(x2) + tcov*(np.mean(xnew)-xnew)/np.var(xnew,ddof=1))
        firstterm1 = (fk1-fk) / c1
        firstterm2 = np.dot(deltafk , P[:] )
        secondterm1 = np.dot(deltafk1 , P[:])
        secondterm2 = np.dot(deltafk , P[:])

        if (firstterm1 > alphak*firstterm2) :
            if firstterm1 <0 :
                alphak = 0.9 * abs(firstterm1/firstterm2)
            else:
                alphak = 0.1 * alphak
            
            if alphak < 1e-6 :
                alphak = 0
                con = 0
            else:  
                con = con + 1
        
            
        elif (secondterm1 < 0) and (secondterm1 < c2*secondterm2):
            con = con + 1
            alphak = 1.1*alphak
        elif (secondterm1 > 0) and (secondterm2 < 0):
            alphak = 0.9*alphak
            con = con + 1
        else:
            con = 0

        # End of if 
    # End of While

    if (con >= 50 ):
        alphak = 0
        # ("Clearning rate searching for fMRI data failed!")

    return alphak

def pica_infomax7(self):    

    """Computes ICA infomax in whitened data
    Decomposes x_white as x_white=AS
    *Input
    STEP : Array of STEP number of Modality         <== Seems not use. No need to pass this parameter
    STOPSIGN : Array of STOPSIGN Boolean flag of Modality <== Seems not use. No need to pass this parameter
    x_white: whitened data (Use PCAwhiten)
    verbose: flag to print optimization updates
    *Output
    A : mixing matrix
    S : source matrix
    W : unmixing matrix
    STEP : Number of STEP
    STOPSIGN : Flag of STOPSIGN to stop updating Weight
    """


    # Initialization
    self.maxsteps = DEFAULT_MAXSTEPS

    data1 = copy.copy(self.GlobalPCA_U_X)

    self.Global_NCOM_X = self.GlobalPCA_U_X.shape[0]        # Global_NCOM
    self.old_weight_X = np.eye(self.Global_NCOM_X)
    bias_X = np.zeros((self.Global_NCOM_X, 1))
    self.d_weight_X = np.zeros(self.Global_NCOM_X)
    self.old_d_weight_X = np.zeros(self.Global_NCOM_X)
    sphere_X = []
    weight_X = []
    chans_X, frames_X =  data1.shape
    datalength_X = frames_X
    DEFAULT_BLOCK_X = int(np.floor(np.sqrt(frames_X/3)))
    DEFAULT_LRATE_X = 0.015/np.log(chans_X)
    delta_X = []
    wts_blowup_X = 0
    activations_X = []
    winvout_X = []


    data2 = copy.copy(self.GlobalPCA_U_Y)
    STEP_Y = 0
    STOPSIGN_Y = 0        

    self.Global_NCOM_Y = self.GlobalPCA_U_Y.shape[0]        # Global_NCOM
    self.old_weight_Y = np.eye(self.Global_NCOM_Y)
    bias_Y = np.zeros((self.Global_NCOM_Y, 1))
    self.d_weight_Y = np.zeros(self.Global_NCOM_Y)
    self.old_d_weight_Y = np.zeros(self.Global_NCOM_Y)
    sphere_Y = []
    weight_Y = []
    chans_Y, frames_Y = data2.shape
    urchans_Y = chans_Y
    datalength_Y = frames_Y
    DEFAULT_BLOCK_Y = int(np.floor(np.sqrt(frames_Y/3)))
    DEFAULT_LRATE_Y = 0.015/np.log(chans_Y)
    delta_Y = []
    wts_blowup_Y = 0
    activations_Y = []
    winvout_Y = []

    DEFAULT_BLOCK = [DEFAULT_BLOCK_X,DEFAULT_BLOCK_Y]
    block = DEFAULT_BLOCK
    DEFAULT_LRATE = [DEFAULT_LRATE_X,DEFAULT_LRATE_Y]
    lrate = DEFAULT_LRATE

    # %%%%%%%%%%%%%%%%%%%%%% Declare defaults used below %%%%%%%%%%%%%%%%%%%%%%%%
    # %

    # %
    # %%%%%%%%%%%%%%%%%%%%%%% Set up keyword default values %%%%%%%%%%%%%%%%%%%%%%%%%
    # %

    # %
    # %%%%%%%%%% Collect keywords and values from argument list %%%%%%%%%%%%%%%
    # %
    Keyword = ''    # Keyword = eval(['p',int2str((i-3)/2 +1)]);
    Value = ''      #Value = eval(['v',int2str((i-3)/2 +1)]);
    Keyword = Keyword.lower() #% convert upper or mixed case to lower

    weights = 0             # fprintf(...'runica(): weights value must be a weight matrix or sphere')
    wts_passed =1

    ncomps = self.Global_NCOM_X    # fprintf(..'runica(): pca value should be the number of principal components to retain')
    pcaflag = 'off'          # fprintf(..'runica(): pca value should be the number of principal components to retain')
    posactflag = DEFAULT_POSACTFLAG        # fprintf('runica(): posact value must be on or off')
    lrate = DEFAULT_LRATE   # fprintf('runica(): lrate value is out of bounds');
    block = DEFAULT_BLOCK   # fprintf('runica(): block size value must be a number')
    nochange = DEFAULT_STOP # fprintf('runica(): stop wchange value must be a number')
    maxsteps   = DEFAULT_MAXSTEPS # fprintf('runica(): maxsteps value must be a positive integer')
    annealstep = 0          # fprintf('runica(): anneal step value must be (0,1]')
    annealdeg = DEFAULT_ANNEALDEG  # fprintf('runica(): annealdeg value is out of bounds [0,180]')
    momentum = 0            # fprintf('runica(): momentum value is out of bounds [0,1]')
    sphering = 'on'         # fprintf('runica(): sphering value must be on or off')
    biasflag = 1            # fprintf('runica(): bias value must be on or off')    ## 1 or 0
    srate = 0               # fprintf('runica(): specgram srate must be >=0')
    loHz = 0                # fprintf('runica(): specgram loHz must be >=0 and <= srate/2')
    hiHz = 1                # fprintf('runica(): specgram hiHz must be >=loHz and <= srate/2')
    Hzinc = 1               # fprintf('runica(): specgram Hzinc must be >0 and <= hiHz-loHz')
    Hzframes = self.GlobalPCA_U_X.shape[1] / 2 # fprintf('runica(): specgram frames must be >=0 and <= data length')
    
 
    extended = 0 #1 #0            # % turn on extended-ICA
    extblocks = DEFAULT_EXTBLOCKS           # % number of blocks per kurt() compute

    # %%%%%%%%%%%%%%%%%%%%%%%% Connect_threshold computation %%%%%%%%%%%%%%%%%%%%%%%%


    # self.cache['logs'].append(printme + "\n")

    if CONSTRAINED_CONNECTION_AUTO :
        Connect_threshold =  p_to_r2 (N)  # % set a threshold to select columns constrained. # 0.20912

    else:
        Connect_threshold =  CONSTRAINED_CONNECTION  # Set to 1


    N = sum(self.NSUB_All_X)
    printme = "\n"  + "\n"
    printme = printme + "[LOG]=====INFOMAX====="  + "\n"
    printme = printme + "[LOG]Number of subject =  "  + str(N) + "\n"

    printme = printme + "[LOG]Global_NCOM_X =  " + str(self.Global_NCOM_X) + "\n"
    printme = printme + "[LOG]Global_NCOM_Y =  " + str(self.Global_NCOM_Y) + "\n"
    printme = printme + "[LOG]CONSTRAINED_CONNECTION = " + str(Connect_threshold) + "\n"
    printme = printme + "[LOG]CONSTRAINED_CONNECTION_PROABILITY =  " + str(CONSTRAINED_CONNECTION_PROABILITY) + "\n"

    # %%%%%%%%%%%%%%%%%%%%%%%% Initialize weights, etc. %%%%%%%%%%%%%%%%%%%%%%%%

    if not extended :
        annealstep = DEFAULT_ANNEALSTEP     # 0.90;DEFAULT_ANNEALSTEP   = 0.90
    else:    
        annealstep = DEFAULT_EXTANNEAL      # 0.98;DEFAULT_EXTANNEAL    = 0.98


    if annealdeg :
        annealdeg  = DEFAULT_ANNEALDEG - momentum*90    #% heuristic DEFAULT_ANNEALDEG    = 60
        if annealdeg < 0 :
            annealdeg = 0

    if ncomps >  chans_X or ncomps < 1 :
        a = 1
        #  ('runica(): number of components must be 1 to %d.' %chans_X)
        return

    #% initialize weights
    #if weights ~= 0,   # weights =0

    # %
    # %%%%%%%%%%%%%%%%%%%%% Check keyword values %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    # %
    if frames_X < chans_X  :
        printme = printme + "runica(): X : data length %d < data channels %f!"%(frames_X,chans_X) + "\n"
        return
    elif frames_Y < chans_Y :
        printme = printme + "runica(): X : data length %d < data channels %f!"%(frames_Y,chans_Y) + "\n"
        return

    # %
    # %%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Process the data %%%%%%%%%%%%%%%%%%%%%%%%%%
    # %

    if verbose :
        printme = printme + " Input data X size [%d,%d] = %d channels, %d frames." \
            %(chans_X, frames_X,chans_X, frames_X) + "\n"
        printme = printme + " Input data Y size [%d,%d] = %d channels, %d frames." \
            %(chans_Y, frames_Y,chans_Y, frames_Y) + "\n"
        
        if pcaflag == 'on' :
            printme = printme + " After PCA dimension reduction,  finding " + "\n"
        else:
            printme = printme + " Finding " + "\n"
        
        if ~extended :
            printme = printme + " %d ICA components using logistic ICA." %(ncomps) + "\n"
        else : #% if extended
            printme = printme + " %d ICA components using extended ICA." %(ncomps) + "\n"
            if extblocks > 0 :
                printme = printme + "Kurtosis will be calculated initially every %d blocks using %d data points." \
                          %(extblocks,MAX_KURTSIZE) + "\n"
            else :
                printme = printme + "Kurtosis will not be calculated. Exactly %d sub-Gaussian components assumed." \
                          % (nsub)  + "\n"
            # end of if extblocks > 0 :
        # end of if ~extended :

        printme = printme + "Initial X learning rate will be %g, block size %d."%(lrate[0],block[0]) + "\n"
        printme = printme + "Initial Y learning rate will be %g, block size %d."%(lrate[1],block[1]) + "\n"

        if momentum > 0:
            printme = printme + "Momentum will be %g." %(momentum) + "\n"

        printme = printme + "Learning rate will be multiplied by %g whenever angledelta >= %g deg."%(annealstep,annealdeg) + "\n"
        printme = printme + "Training will end when wchange < %g or after %d steps."%(nochange,maxsteps) + "\n"
        if biasflag :
            printme = printme + "Online bias adjustment will be used." + "\n"
        else:
            printme = printme + "Online bias adjustment will not be used." + "\n"
        # end of if biasflag :
    # end of  if verbose :
    # %
    # %%%%%%%%%%%%%%%%%%%%%%%%% Remove overall row means %%%%%%%%%%%%%%%%%%%%%%%%
    # %
    printme = printme + "Not removing mean of each channel!!!" + "\n"


    if verbose :
        printme = printme + "Final training data1 range: %g to %g" % (np.amin(data1),np.amax(data1)) + "\n"
        printme = printme + "Final training data1 range: %g to %g" % (np.amin(data2),np.amax(data2)) + "\n"

    # %
    # %%%%%%%%%%%%%%%%%%% Perform PCA reduction %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    # %
    if pcaflag =='on' :
        printme = printme + "Reducing the data to %d principal dimensions..."%(ncomps) + "\n"
        # % make data its projection onto the ncomps-dim principal subspace
    # end of if pcaflag =='on' :

    # %
    # %%%%%%%%%%%%%%%%%%% Perform specgram transformation %%%%%%%%%%%%%%%%%%%%%%%
    # %
    if srate > 0 :
        printme = printme + "srate > 0 " + "\n"
    # end of if srate > 0
    # %
    # %%%%%%%%%%%%%%%%%%% Perform sphering %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    # %        


    if sphering == 'on' :
        if verbose :
            printme = printme + "Computing the sphering matrix..." + "\n"
        sphere_X_1 = np.cov(data1.T,rowvar=False )     
        sphere_X_2 = (sqrtm( sphere_X_1   ))     
        sphere_X_3 = inv(sphere_X_2)     
        sphere_X = 2.0*sphere_X_3    


        sphere_Y_1 = np.cov(data2.T,rowvar=False )     
        sphere_Y_2 = (sqrtm( sphere_Y_1   ))     
        sphere_Y_3 = inv(sphere_Y_2)     
        sphere_Y = 2.0*sphere_Y_3

        if not weights :
            if verbose :
                printme = printme + " Starting weights are the identity matrix ..." + "\n"

            weights = 1

            weight_X = np.eye(self.Global_NCOM_X, chans_X) #% begin with the identity matrix
            weight_Y = np.eye(self.Global_NCOM_Y, chans_Y) #% begin with the identity matrix

        else  :  #% weights given on commandline
            if verbose :
                printme = printme + " Using starting weights named on commandline ..." + "\n"
            
        # end of if not weights :
        if verbose :
            printme = printme + " Sphering the data ..." + "\n"
                    
        data1 = copy.copy(np.dot(sphere_X,data1))     # % actually decorrelate the electrode signals
        data2 = copy.copy(np.dot(sphere_Y,data2))     # % actually decorrelate the electrode signals
    elif sphering == 'off' : # %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
        if  not weights :
            if verbose :
                printme = printme + " Using the sphering matrix as the starting weight matrix ..." + "\n"
                printme = printme + " Returning the identity matrix in variable sphere ..." + "\n"


            sphere_X = 2.0*np.inv(sqrtm(np.cov(data1.T,rowvar=False))) # % find the "sphering" matrix = spher()
            weight_X = np.eye(self.Global_NCOM_X,chans_X) * sphere_X # % begin with the identity matrix
            sphere_X = np.eye(chans_X)               #   % return the identity matrix

            sphere_Y = 2.0*np.inv(sqrtm(np.cov(data2.T,rowvar=False)))  # % find the "sphering" matrix = spher()
            weight_Y = np.eye(self.Global_NCOM_Y,chans_Y) * sphere_Y # % begin with the identity matrix
            sphere_Y = np.eye(chans_Y)               #   % return the identity matrix
            
        else : # % weights ~= 0
            if verbose :
                printme = printme + " Using starting weights named on commandline ..." + "\n"
                printme = printme + " Returning the identity matrix in variable sphere ..." + "\n"
            
            sphere_X = np.eye(chans_X)             #  % return the identity matrix
            sphere_Y = np.eye(chans_Y)             #  % return the identity matrix
        # end not weights :
    elif sphering == 'none':
        sphere_X = np.eye(chans_X)             #  % return the identity matrix
        sphere_Y = np.eye(chans_Y)             #  % return the identity matrix
        if not weights  : 
            if verbose :
                printme = printme + " Starting weights are the identity matrix ..." + "\n"
                printme = printme + " Returning the identity matrix in variable sphere ..." + "\n"
            # end of if verbose :

            weight_X = np.eye(self.Global_NCOM_X, chans_X) #% begin with the identity matrix
            weight_Y = np.eye(self.Global_NCOM_Y, chans_Y) #% begin with the identity matrix

        else : # % weights ~= 0
            if verbose : 
                printme = printme + " Using starting weights named on commandline ..." + "\n"
                printme = printme + " Returning the identity matrix in variable sphere ..." + "\n"
            # end of if verbose :
        # end not weights :
        sphere_X = np.eye(chans_X,chans_X)              #  % return the identity matrix
        sphere_Y = np.eye(chans_Y,chans_Y)              #  % return the identity matrix            
        if verbose :
            printme = printme + "Returned variable sphere will be the identity matrix." + "\n"
        # end of if verbose 
    #end sphering == 'on' :



    # %
    # %%%%%%%%%%%%%%%%%%%%%%%% Initialize ICA training %%%%%%%%%%%%%%%%%%%%%%%%%
    # %


    # 
    lastt_X = np.fix((datalength_X/block[0]-1)*block[0]+1)
    lastt_Y = np.fix((datalength_Y/block[1]-1)*block[1]+1)
    degconst = 180/np.pi


    BI_X = block[0] * np.eye(self.Global_NCOM_X,self.Global_NCOM_X)
    BI_Y = block[1] * np.eye(self.Global_NCOM_Y,self.Global_NCOM_Y) 
    delta_X = np.zeros((1,chans_X * chans_X))
    delta_Y = np.zeros((1,chans_Y * chans_Y))
    change_X = 1
    change_Y = 1
    oldchange_X = 0
    oldchange_Y = 0
    startweight_X = copy.copy(weight_X)
    startweight_Y = copy.copy(weight_Y)
    prevweight_X = copy.copy(startweight_X)
    prevweight_Y = copy.copy(startweight_Y)
    oldweight_X = copy.copy(startweight_X)
    oldweight_Y = copy.copy(startweight_Y)

    prevwtchange_X = np.zeros((chans_X,self.Global_NCOM_X))
    prevwtchange_Y = np.zeros((chans_Y,self.Global_NCOM_Y))      
    oldwtchange_X = np.zeros((chans_X,self.Global_NCOM_X))       
    oldwtchange_Y = np.zeros((chans_Y,self.Global_NCOM_Y))

    lrates_X = np.zeros((1,maxsteps))
    lrates_Y = np.zeros((1,maxsteps))
    onesrow_X = np.ones((1,block[0]))
    onesrow_Y = np.ones((1,block[1]))

    signs_X = np.ones((1,self.Global_NCOM_X)) #    % initialize signs to nsub -1, rest +1
    signs_Y = np.ones((1,self.Global_NCOM_Y)) #    % initialize signs to nsub -1, rest +1

    for k in range(1,nsub) : 
        signs_X[k] = -1
        signs_Y[k] = -1
    # end for
    
    if extended and extblocks < 0 and verbose :
        printme = printme + "Fixed extended-ICA sign assignments:  " + "\n"

    # end if

    signs_X = np.diag(signs_X) # % make a diagonal matrix
    signs_Y = np.diag(signs_Y) # % make a diagonal matrix

    oldsigns_X = np.zeros(signs_X.size)
    oldsigns_Y = np.zeros(signs_Y.size)
    change_X = 0.0
    change_Y = 0.0
    signcount_X = 0 #   % counter for same-signs
    signcount_Y = 0 #   % counter for same-signs
    signcounts_X = 0
    signcounts_Y = 0
    urextblocks = copy.copy(extblocks) #  % original value, for resets


    old_kk_X = np.zeros((1,self.Global_NCOM_X)) #   % for kurtosis momemtum
    old_kk_Y = np.zeros((1,self.Global_NCOM_Y)) #   % for kurtosis momemtum

    # %
    # %%%%%%%% ICA training loop using the logistic sigmoid %%%%%%%%%%%%%%%%%%%
    # %

    if verbose :
        printme = printme + "Beginning ICA training ..." + "\n"
        if extended :
            printme = printme + " first training step may be slow ..." + "\n"
        else:
            printme = printme + "\n"
        # end if
    # end if
    STEP_X = 0
    STEP_Y = 0
    blockno_X = 0
    blockno_Y = 0
    STOPSIGN_X  = 0
    STOPSIGN_Y  = 0

    alphak_X = 1
    alphak_Y = 1
    Crate_X = copy.copy(CRATE_X)
    Crate_Y = copy.copy(CRATE_Y)


    lrate_X = DEFAULT_LRATE_X
    lrate_Y = DEFAULT_LRATE_Y
    lossf_X = np.zeros(maxsteps+1)
    lossf_Y = np.zeros(maxsteps+1)

    angledelta_X = 0        
    angledelta_Y = 0        

    entropy_X = 0
    entropy_Y = 0

    entropychange_X = 0
    entropychange_Y = 0

    # Entropy   
    Loop_num = 1
    Loop_list = []
    Loop_list_X = []
    Loop_list_Y = []
    STEP_list_X = []
    STEP_list_Y = []
    STOPSIGN_list_X = []
    STOPSIGN_list_Y = []
    Crate_list_X = []
    Crate_list_Y = []
    entropy_list_X = []
    entropy_list_Y = []
    entropychange_list_X = []
    entropychange_list_Y = []
    costfunction_corrcoef_list_maxcorr_XY = []
    costfunction_corrcoef_list_maxcorr_test_XY = []
    mymaxcorr = 0
    mymaxcorr_test = 0
    myentropy_X = 0
    myentropy_Y = 0



    printme = printme + "[LOG]=====INFOMAX=====maxsteps=" +  str(maxsteps) + "\n"


    # %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    while (STEP_X < maxsteps or STEP_Y < maxsteps) :

        # Entropy
        Loop_list.append(Loop_num)
        Loop_list_X.append([Loop_num,Loop_num])
        Loop_list_Y.append([Loop_num,Loop_num])

        if not STOPSIGN_X :

            eps = np.finfo(np.float32).eps
            u = copy.copy(np.dot(weight_X , data1) + np.dot( bias_X , np.ones((1,frames_X)) ))
            y = copy.copy(1 / (1 + np.exp(-u)  ))

            yy = copy.copy((1-y))
            temp1 = copy.copy(np.dot(weight_X,y))
            temp2 = copy.copy((temp1 * yy))
            temp = copy.copy(np.log( abs( temp2 ) + eps))

            entropy_X = np.mean(temp)

            entropy_list_X.append([Loop_num,entropy_X])        
            myentropy_X = copy.copy(entropy_X)


            # ------------

            # begin to update weight matrix
            weight_X, bias_X, lrate_X, wts_blowup_X = weight_update4(weight_X, data1, bias_X, lrate_X, False)


            # %---------------------------
            # % if weight is not  blowup, update
            if not wts_blowup_X :
                
                oldwtchange_X  = copy.copy(weight_X - oldweight_X)
                STEP_X = copy.copy(STEP_X + 1)
                lrates_X[0,STEP_X] = copy.copy(lrate_X)
                angledelta_X = 0 
                delta_X = copy.copy(oldwtchange_X.reshape(1 , chans_X* self.Global_NCOM_X ,order='F'))                
                change_X = copy.copy(np.dot(delta_X,delta_X.T))
                
            # end if not wts_blowup_X
            #%DATA1 blow up restart-------------------------------
            if wts_blowup_X or np.isnan(change_X) or np.isinf(change_X) : #  % if weights blow up,
                printme = printme + "\n"
                STEP_X = 0
                STOPSIGN_X = 0 #                % start again
                change_X = copy.copy(nochange)
                wts_blowup_X = 0 #                    % re-initialize variables
                blockno_X = 1
                lrate_X = copy.copy(lrate_X * DEFAULT_RESTART_FAC) #% with lower learning rate
                weight_X  = copy.copy(startweight_X)  #            % and original weight matrix
                oldweight_X  = copy.copy(startweight_X)
                oldwtchange_X = np.zeros((chans_X,self.Global_NCOM_X))  
                delta_X = np.zeros((1,chans_X * chans_X))
                olddelta_X = copy.copy(delta_X)
                extblocks = copy.copy(urextblocks)
                prevweight_X  = copy.copy(startweight_X)
                prevwtchange_X = np.zeros((chans_X,self.Global_NCOM_X))
                bias_X = copy.copy(np.zeros((self.Global_NCOM_X, 1)))
                lrates_X = copy.copy(np.zeros((1,maxsteps)))

                # Entropy                    
                entropychange_list_X.append([Loop_num,2.0])

                if extended : 
                    signs_X = copy.copy(np.ones((1,self.Global_NCOM_X)))  #% initialize signs to nsub -1, rest +1
            
                    for k in range(1,nsub) :
                        signs_X[k] = -1
                    # end for
                    signs_X = np.diag(signs_X) # % make a diagonal matrix
                    oldsigns_X = np.zeros(signs_X.size)
                # end if extended
                if lrate_X > MIN_LRATE :
                    r =  copy.copy(matrix_rank(data1))
                    if r < self.Global_NCOM_X :
                        printme = printme + "Data has rank %d. Cannot compute %d components."%( r,self.Global_NCOM_X) + "\n"
                        return
                    else : 
                        printme = printme + "Lowering learning rate to %g and starting again." %(lrate_X) + "\n"
                    #end if
                else :
                    printme = printme + "XXXXX runica(): QUITTING - weight matrix may not be invertible! XXXXXX" + "\n"
                    return
                #end if 
            else  : #% if DATA1 weights in bounds
                # %testing the trend of entropy term, avoiding the overfitting of correlation

                u = copy.copy(np.dot(weight_X , data1 [:, :]) + bias_X * np.ones((1,frames_X)))
                y = copy.copy(1/(1 + np.exp(-u)))              
                temp = copy.copy(np.log(abs( (np.dot(weight_X,y) * (1-y) ) + eps)))
                lossf_X[STEP_X] = copy.copy(np.mean(temp) )
                
                #%changes of entropy term added by jingyu
                if STEP_X > 1 :
                    entropychange_X = lossf_X[STEP_X] - entropy_X
                else :
                    entropychange_X = 1
                # Entropy                    
                entropychange_list_X.append([Loop_num,entropychange_X])               
                #end
                #%--------
                
                if STEP_X > 5 :
                    a = 1 + 1
                    index_X = copy.copy(ica_fuse_falsemaxdetect(self, lossf_X,trendPara))
                    if index_X :
                        Crate_X  = copy.copy(Crate_X*CRATE_PERCENT) #         % anneal learning rate empirical
                    # end if
                #end % end of test------------------------

                # %%%%%%%%%%%%% Print weight update information %%%%%%%%%%%%%%%%%%%%%%
                # %

                if STEP_X  > 2 and not STOPSIGN_X :
                    change_temp = copy.copy(float( np.sqrt( float(change_X.real) * float(oldchange_X.real) )))
                    delta_temp = copy.copy(np.dot(delta_X , olddelta_X.T ))
                    angledelta_X = copy.copy(math.acos(delta_temp/  change_temp    ))  # (1, 64) x (1, 64).T

                #end
                if verbose :
                    if STEP_X > 2 :
                        if not extended :
                            printme = printme + "Dataset X step %d - lrate %7.6f, wchange %7.6f, angledelta %4.1f deg, Crate_X %f, eX %f, eY %f, maxC %f, mc_test %f" \
                            %( STEP_X, lrate_X, change_X, degconst*angledelta_X, Crate_X, entropy_X, entropy_Y, mymaxcorr, mymaxcorr_test) + "\n"
                        else :

                            printme = printme + "Dataset X step %d - lrate %7.6f, wchange %7.6f, angledelta %4.1f deg, %d subgauss" \
                                %( STEP_X, lrate_X, change_X, degconst*angledelta_X, (self.Global_NCOM_X - sum(np.diag(signs_X)))/2) + "\n"
                        #end
                    elif not extended :
                        printme = printme + "Dataset X step %d - lrate %7.6f, wchange %7.6f" %(STEP_X, lrate_X, change_X.astype(np.float)) + "\n"
                    else:

                        printme = printme + "Dataset X step %d - lrate %5f, wchange %7.6f, %d subgauss" \
                            %( STEP_X, lrate_X, change_X, (self.Global_NCOM_X - sum(np.diag(signs_X)))/2) + "\n"
                    #end % step > 2
        
                # %%%%%%%%%%%%%%%%%%%% Anneal learning rate %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                # %
                if entropychange_X < 0  : #%| degconst*angledelta(1) > annealdeg,
                    lrate_X = copy.copy(lrate_X * annealstep) #          % anneal learning rate
                    olddelta_X = copy.copy(delta_X)  #                % accumulate angledelta until
                    oldchange_X  = copy.copy(change_X) #              %  annealdeg is reached
                elif STEP_X == 1 : #                     % on first step only
                    olddelta_X   = copy.copy(delta_X) #                % initialize
                    oldchange_X  = copy.copy(change_X)
                # end
                
                #%%%%%%%%%%%%%%%%%%%% Apply stopping rule %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                # Apply stopping rule               
                if STEP_X  > 2 and change_X < nochange:    # apply stopping rule
                    STOPSIGN_X  = 1                    # stop when weights stabilize
                    printme = printme + "STOPSIGN_X = True"+ "\n"
                elif STEP_X  >= maxsteps :
                    STOPSIGN_X  = 1                    # max step
                    printme = printme + "STOPSIGN_X = True"+ "\n"
                elif change_X > DEFAULT_BLOWUP :       # if weights blow up,
                    lrate_X = copy.copy(lrate_X * DEFAULT_BLOWUP_FAC)    # keep trying with a smaller learning rate
                # end if
                # %%%%%%%%%%%%%%%%%% Save current values %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                oldweight_X  = (weight_X)


            #end% end if weights in bounds
        # end if ~stopsign(1)

        # Entropy
        STEP_list_X.append([Loop_num,STEP_X])
        STOPSIGN_list_X.append([Loop_num,STOPSIGN_X])
        Crate_list_X.append([Loop_num,Crate_X])       


        if not STOPSIGN_Y :
            # Global ICA - Find Global A (aka find Global W) using Infomax         
            # print('[LOG][Flow_5_Global_ICA]=====Modality_Y : Find Global A (aka find Global W) using Infomax =====')

            eps = np.finfo(np.float32).eps
            u = copy.copy(np.dot(weight_Y , data2) + np.dot( bias_Y , np.ones((1,frames_Y)) ))
            y = copy.copy(1 / (1 + np.exp (-u)))
            # y = 1 / (1 + expit(-u))
            yy = copy.copy((1-y))                              # MatLab : size=8x58179 Pyton : size=8x58179
            temp1 = copy.copy(np.dot(weight_Y,y))              # MatLab : size=8x58179 Pyton : size=8x58179
            temp2 = copy.copy((temp1 * yy))                    # MatLab : size=8x58179 Pyton : size=8x58179
            temp = copy.copy(np.log( abs( temp2 ) + eps))      # MatLab : size=8x58179 Pyton : size=8x58179

            entropy_Y = np.mean(temp)       # MatLab : -2.105741089518763Pyton : -2.1057364012057698
            # Entropy            
            entropy_list_Y.append([Loop_num,entropy_Y]) 
            myentropy_Y = copy.copy(entropy_Y)



            # ------------

            # begin to update weight matrix
            weight_Y, bias_Y, lrate_Y, wts_blowup_Y = weight_update4(weight_Y, data2, bias_Y, lrate_Y, False)


            # %---------------------------
            # % if weight is not  blowup, update
            if not wts_blowup_Y :
                
                oldwtchange_Y  = copy.copy (weight_Y - oldweight_Y)
                STEP_Y = STEP_Y + 1
                lrates_Y[0,STEP_Y] = copy.copy (lrate_Y)
                angledelta_Y = 0 
                delta_Y = copy.copy(oldwtchange_Y.reshape(1 , chans_Y* self.Global_NCOM_Y ,order='F'))
                change_Y = copy.copy(np.dot(delta_Y,delta_Y.T))
                
            # end if not wts_blowup_Y
            #%DATA1 blow up restart-------------------------------
            if wts_blowup_Y or np.isnan(change_Y) or np.isinf(change_Y) : #  % if weights blow up,
                # print(' ')
                STEP_Y = 0
                STOPSIGN_Y = 0 #                % start again
                change_Y = copy.copy (nochange)
                wts_blowup_Y = 0 #                    % re-initialize variables
                blockno_Y = 1
                lrate_Y = copy.copy (lrate_Y * DEFAULT_RESTART_FAC) #% with lower learning rate
                weight_Y  = copy.copy (startweight_Y)  #            % and original weight matrix
                oldweight_Y  = copy.copy (startweight_Y)
                oldwtchange_Y = np.zeros((chans_Y,self.Global_NCOM_Y))  
                delta_Y = np.zeros((1,chans_Y * chans_Y))
                olddelta_Y = copy.copy (delta_Y)
                extblocks = copy.copy (urextblocks)
                prevweight_Y  = copy.copy (startweight_Y)
                prevwtchange_Y = np.zeros((chans_Y,self.Global_NCOM_Y))
                bias_Y = np.zeros((self.Global_NCOM_Y, 1))
                lrates_Y = np.zeros((1,maxsteps))

                # Entropy                    
                entropychange_list_Y.append([Loop_num,2.0])

                if extended : 
                    signs_Y = copy.copy(np.ones((1,self.Global_NCOM_Y)))  #% initialize signs to nsub -1, rest +1
            
                    for k in range(1,nsub) :
                        signs_Y[k] = -1
                    # end for
                    signs_Y = np.diag(signs_Y) # % make a diagonal matrix
                    oldsigns_Y = np.zeros(signs_Y.size)
                # end if extended
                if lrate_Y > MIN_LRATE :
                    r =  matrix_rank(data2) 
                    if r < self.Global_NCOM_Y :
                        printme = printme + "Data has rank %d. Cannot compute %d components." %( r,self.Global_NCOM_Y) + "\n"
                        return
                    else :
                        printme = printme + "Lowering learning rate to %g and starting again." %(lrate_Y) + "\n"
                    #end if
                else :
                    printme = printme + "XXXXX runica(): QUITTING - weight matrix may not be invertible! XXXXXX" + "\n"
                    return
                #end if 
            else  : #% if DATA1 weights in bounds
                # %testing the trend of entropy term, avoiding the overfitting of correlation

                u = copy.copy(np.dot(weight_Y , data2 [:, :]) + bias_Y * np.ones((1,frames_Y)))
                y = copy.copy(1/(1 + np.exp(-u)))
                temp = copy.copy(np.log(abs( (np.dot(weight_Y,y) * (1-y) ) + eps)))
                lossf_Y[STEP_Y] = copy.copy(np.mean(temp) )     # MATLAB -2.05926744085665  PYTHON = -2.0592651746
                
                #%changes of entropy term added by jingyu
                if STEP_Y > 1 :
                    entropychange_Y = copy.copy(lossf_Y[STEP_Y] - entropy_Y)
                else :
                    entropychange_Y = 1
                # Entropy                    
                entropychange_list_Y.append([Loop_num,entropychange_Y])               
                #end
                #%--------
                
                if STEP_Y > 5 :
                    index_Y = copy.copy(ica_fuse_falsemaxdetect(self, lossf_Y,trendPara)) # Test Entropy deciding to reduce Change_rate
                    if index_Y :
                        # Crate_Y  = Crate_Y*0.9 #         % anneal learning rate empirical
                        Crate_Y  = copy.copy(Crate_Y*CRATE_PERCENT) #         % anneal learning rate empirical
                        # print('Dataset Y step %d - ica_fuse_falsemaxdetect index_Y %5f, Crate_Y %f, trendPara %f ' %(STEP_Y, index_Y, Crate_Y, trendPara))

                    # end if
                #end % end of test------------------------

                # %%%%%%%%%%%%% Print weight update information %%%%%%%%%%%%%%%%%%%%%%
                # %

                if STEP_Y  > 2 and not STOPSIGN_Y :

                    change_temp = copy.copy(float( np.sqrt( float(change_Y.real) * float(oldchange_Y.real) )))
                    delta_temp = copy.copy(np.dot(delta_Y , olddelta_Y.T ))
                    angledelta_Y = copy.copy(math.acos(delta_temp/  change_temp    ))  # (1, 64) x (1, 64).T

                #end
                if verbose :
                    if STEP_Y > 2 :
                        if not extended :
                            printme = printme + "Dataset Y step %d - lrate %7.6f, wchange %7.6f, angledelta %4.1f deg, Crate_Y %f, eX %f, eY %f, maxC %f, mc_test %f" \
                                %( STEP_Y, lrate_Y, change_Y, degconst*angledelta_Y, Crate_Y, entropy_X, entropy_Y, mymaxcorr, mymaxcorr_test)  + "\n"
                        else :
                            printme = printme + "Dataset Y step %d - lrate %7.6f, wchange %7.6f, angledelta %4.1f deg, %d subgauss" \
                                %( STEP_Y, lrate_Y, change_Y, degconst*angledelta_Y, (self.Global_NCOM_Y - sum(np.diag(signs_Y)))/2) + "\n"
                        #end
                    elif not extended :
                        printme = printme + "Dataset Y step %d - lrate %7.6f, wchange %7.6f" %(STEP_Y, lrate_Y, change_Y) + "\n"
                    else:

                        printme = printme + "Dataset Y step %d - lrate %7.6f, wchange %7.6f, %d subgauss" \
                            %( STEP_Y, lrate_Y, change_Y, (self.Global_NCOM_Y - sum(np.diag(signs_Y)))/2) + "\n"
                    #end % step > 2
        
                # %%%%%%%%%%%%%%%%%%%% Anneal learning rate %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                # %
                if entropychange_Y < 0  : #%| degconst*angledelta(1) > annealdeg,
                    lrate_Y = copy.copy (lrate_Y * annealstep) #          % anneal learning rate
                    olddelta_Y = copy.copy (delta_Y)  #                % accumulate angledelta until
                    oldchange_Y  = copy.copy (change_Y) #              %  annealdeg is reached
                elif STEP_Y == 1 : #                     % on first step only
                    olddelta_Y   = copy.copy (delta_Y) #                % initialize
                    oldchange_Y  = copy.copy (change_Y)
                # end
                
                #%%%%%%%%%%%%%%%%%%%% Apply stopping rule %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                # Apply stopping rule               
                if STEP_Y  > 2 and change_Y < nochange:    # apply stopping rule
                    STOPSIGN_Y  = 1                    # stop when weights stabilize
                    printme = printme + "STOPSIGN_Y = True" + "\n"
                elif STEP_Y  >= maxsteps :
                    STOPSIGN_Y  = 1                    # max step
                    printme = printme + "STOPSIGN_Y = True" + "\n"
                elif change_Y > DEFAULT_BLOWUP :       # if weights blow up,
                    lrate_Y = copy.copy (lrate_Y * DEFAULT_BLOWUP_FAC)    # keep trying with a smaller learning rate
                # end if
                # %%%%%%%%%%%%%%%%%% Save current values %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                oldweight_Y  =  (weight_Y)


            #end% end if weights in bounds
        # end if ~stopsign(2) 
        # Entropy
        STEP_list_Y.append([Loop_num,STEP_Y])
        STOPSIGN_list_Y.append([Loop_num,STOPSIGN_Y])
        Crate_list_Y.append([Loop_num,Crate_Y])       


        GlobalW_unmixer_X =  (weight_X)
        GlobalA_mixer_X  =  (inv(GlobalW_unmixer_X))
        GlobalW_unmixer_Y =  (weight_Y)
        GlobalA_mixer_Y  = (inv(GlobalW_unmixer_Y)   )
  

        # ('[LOG][Flow_5_Global_ICA]=====End=====')
        # ('[LOG][Flow_5_Global_ICA]===== Check_I_X=====')

        

        #
        # Parrelle ICA - Correlation A
        #
        # ('[LOG][Flow_7_Parallel_ICA-Correlation_A]=====Start=====')

        # Parallel ICA - Find Correlation local A       

        # ('[LOG][Flow_7_Parallel_ICA-Correlation_A]=====Modality_X and _Y : Find Correlation A====='

        # Parrelle ICA start
        # Parrelle ICA - Local reconstruction

        # % -------------------------
        # % modifying weights based on correlation between data1 A Matrix and data2 A Matrix
        # % %%%%%%%%%%%%%%%%%nudging

        if (STEP_X >2 and STEP_Y > 2) and ( not STOPSIGN_X or not STOPSIGN_Y ) :

            #
            # print('[LOG][Flow_6_Parallel_ICA-Local_reconstruction]=====Start=====')   

            # Parallel ICA - Find local A using GlobalPCA_dewhite_X and Con_deWhite_X    
            # Called Local-reconstruction from-Global-to-Local     

            LocalA_All_X = (local_reconstruction8(self, GlobalW_unmixer_X, GlobalA_mixer_X, \
                self.GlobalPCA_dewhite_X, self.Con_deWhite_X, self.NSUB_All_X, self.NCOM_All_X, self.SITE_NUM, B_GLOBAL, False))

 
            LocalA_All_Y = (local_reconstruction8(self, GlobalW_unmixer_Y, GlobalA_mixer_Y, \
                self.GlobalPCA_dewhite_Y, self.Con_deWhite_Y, self.NSUB_All_Y, self.NCOM_All_Y, self.SITE_NUM, B_GLOBAL, False))


            ###############################################
            ###############################################
            ###############################################

            # ('[LOG][Flow_7_Parallel_ICA-Correlation_A]=====Start=====')

            # Parallel ICA - Find Correlation local A       

            # ('[LOG][Flow_7_Parallel_ICA-Correlation_A]=====Modality_X and _Y : Find Correlation A=====')

            mx = copy.copy (LocalA_All_X)
            sx = copy.copy (LocalA_All_Y)
            Corr_matrix = copy.copy(np.abs(ica_fuse_corr(self, mx,sx)))  # 8 x 8

            j_min = copy.copy(min(int(self.Global_NCOM_X),int(self.Global_NCOM_Y)))
            maxcorr=np.zeros(j_min)
            maxcol=np.zeros(j_min)
            maxrow=np.zeros(j_min)

            for j in range(j_min)  :
                [mm,ss] = copy.copy(np.unravel_index(np.argmax(Corr_matrix, axis=None), Corr_matrix.shape))
                maxcol[j] = copy.copy(mm)      # 8
                maxrow[j] = copy.copy(ss)      # 1
                maxcorr[j] = copy.copy(Corr_matrix[mm,ss])         # 1 x 8
                Corr_matrix[mm,:]=0
                Corr_matrix[:,ss]=0

            costfunction_corrcoef_list_maxcorr_XY.append([Loop_num, maxcorr[0]])
            mymaxcorr =  copy.copy (maxcorr[0])


            ix = copy.copy(np.array(np.where (maxcorr > Connect_threshold)))


            if not (np.size(ix)==0) :  # ~isempty(ix) :
                if (np.size(ix)) > MaxComCon :
                    ix = copy.copy(np.resize(ix,(1,MaxComCon)) )                               

                # If not empty, do here      
                a =[]
                a_X = []
                a_Y = []
                u = []
                u_X = []
                u_Y = []
                for Cons_com in range(np.size(ix)) : # % constraned componenets
                    #% Updata the weights

                    a = copy.copy (mx[:,int(maxcol[Cons_com])])
                    a_X = copy.copy(a)
                    a_Y = copy.copy(a)
                    u = copy.copy (sx[:,int(maxrow[Cons_com])])
                    u_X = copy.copy(u)
                    u_Y = copy.copy(u)

                    b1 = copy.copy(np.cov(a,u))  
                    b = b1[0,1]

                    tmcorr = copy.copy(b/np.std(a, ddof=1) / np.std(u, ddof=1))

                    comterm = copy.copy(2*b/np.var(a,ddof=1)/np.var(u,ddof=1))

                    coml = len(a)
                    
                    if not STOPSIGN_X : # %& ~Overindex1
                        deltaf_X = copy.copy(comterm * ( u_X - np.mean(u_X) + (b * (np.mean(a_X)-a_X)  /  (np.var(a_X,ddof=1)) ) ))
                        P_X = copy.copy(deltaf_X / np.linalg.norm(deltaf_X))
                        alphak_X = copy.copy(findsteplength1 (-tmcorr**2, -deltaf_X, a_X, u_X, alphak_X, P_X, 0.0001, 0.999))
                        aweights_X = copy.copy(Crate_X * alphak_X * P_X)
                        mx[:,int(maxcol[Cons_com])] = copy.copy (mx[:, int(maxcol[Cons_com])] + aweights_X)
                    # end if not STOPSIGN_X 

                    if not STOPSIGN_Y : # not Overindex1 
                        deltaf_Y = copy.copy((comterm * (a_Y - np.mean(a_Y) + b/np.var(u,ddof=1)*(np.mean(u_Y) - u_Y))))
                        P_Y = copy.copy(deltaf_Y / np.linalg.norm(deltaf_Y))
                        alphak_Y = copy.copy(findsteplength1 (-tmcorr**2, -deltaf_Y, u_Y, a_Y, alphak_Y, P_Y, 0.0001, 0.999))
                        aweights_Y = copy.copy(Crate_Y * alphak_Y * P_Y)
                        sx[:,int(maxrow[Cons_com])] = copy.copy (sx[:,int(maxrow[Cons_com])] + aweights_Y)
                    # end if not STOPSIGN_Y     


                # end for Cons_com 

                #
                # Parrelle ICA - Global reconstruction
                #
                # ('[LOG][Flow_8_Parallel_ICA-Global_reconstruction]=====Start=====')

                if not STOPSIGN_X :
                    temp = copy.copy (weight_X )

                    # Parallel ICA - Find Global A (Flow#5) using Con_White_X and GlobalPCA_White_X 
                    # Called Global-reconstruction from-Local-to-Global     
                    # ('[LOG][Flow_8_Parallel_ICA-Global_reconstruction]=====Modality_X : Find Global A (Flow#5) using Con_White_X and GlobalPCA_White_X====')


                    GlobalA_mixer_X = (global_reconstruction8(self, mx,
                        self.GlobalPCA_White_X, self.Con_White_X, self.NSUB_All_X, self.NCOM_All_X, SITE_NUM, B_GLOBAL)  )

                    # Print all Modality Correlation A shape
                    # ('[LOG][Flow_8_Parallel_ICA-Global_reconstruction]=====Print all Modality Global A shape=====')
                    # ('Modality_X === GlobalA_mixer_X (r_X x r_X)',GlobalA_mixer_X.shape )

                    #
                    # Parrelle ICA - Global Weight update
                    #
                    # ('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update]=====Start=====')

                    # Parallel ICA - Update Global Weight of all Modality from Global A mixer
                    # ('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update]=====Update Global Weight of all Modality from Global A mixer=====')
                    weight_X = copy.copy (inv(GlobalA_mixer_X))


                    if np.amax(abs(weight_X)) > MAX_WEIGHT :
                        Crate_X = Crate_X *0.95
                        weight_X = temp
                        printme = printme + "weight_X > MAX_WEIGHT !!!! Crate_X" + "\n"
                    # end if
                # end if not STOPSIGN_X :

                if not STOPSIGN_Y :
                    temp = copy.copy(weight_Y )

                    # Parallel ICA - Find Global A (Flow#5) using Con_White_X and GlobalPCA_White_X 
                    # Called Global-reconstruction from-Local-to-Global  
                    # ('[LOG][Flow_8_Parallel_ICA-Global_reconstruction]=====Modality_Y : Find Global A (Flow#5) using Con_White_Y and GlobalPCA_White_Y====')


                    GlobalA_mixer_Y = (global_reconstruction8(self, sx,
                        self.GlobalPCA_White_Y, self.Con_White_Y, self.NSUB_All_Y, self.NCOM_All_Y, SITE_NUM, B_GLOBAL) )


                    # Print all Modality Correlation A shape
                    # ('[LOG][Flow_8_Parallel_ICA-Global_reconstruction]=====Print all Modality Global A shape=====')
                    # ('Modality_X === GlobalA_mixer_X (r_X x r_X)',GlobalA_mixer_X.shape )
                    # ('Modality_Y === GlobalA_mixer_Y (r_Y x r_Y)',GlobalA_mixer_Y.shape )

                    # ('[LOG][Flow_8_Parallel_ICA-Global_reconstruction]=====End=====')

                    #
                    # Parrelle ICA - Global Weight update
                    #
                    # ('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update]=====Start=====')

                    # Parallel ICA - Update Global Weight of all Modality from Global A mixer
                    # ('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update]=====Update Global Weight of all Modality from Global A mixer=====')
                    weight_Y = copy.copy(inv(GlobalA_mixer_Y))


                    if np.amax(abs(weight_Y)) > MAX_WEIGHT :
                        Crate_Y = Crate_Y *0.95
                        weight_Y = copy.copy(temp)
                        printme = printme + "weight_Y > MAX_WEIGHT !!!! Crate_Y" + "\n"
                    # end if
                # end if not STOPSIGN_Y :

                # Test - Validation of Weight 
                #%             test ---------------------
                # This is for testing and validating if Weight is in Wrong direction or NOT.
                # ('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update] Testing and validating ===== Start =====')


                LocalA_All_X_test = copy.copy(local_reconstruction8(self, weight_X, GlobalA_mixer_X, \
                    self.GlobalPCA_dewhite_X, self.Con_deWhite_X, self.NSUB_All_X, self.NCOM_All_X, SITE_NUM, B_GLOBAL, True))

  
                # ('[LOG][Flow_6_Parallel_ICA-Local_reconstruction]=====Modality_Y : Find local A using GlobalPCA_dewhite_Y and Con_deWhite_Y   =====')

                LocalA_All_Y_test = copy.copy(local_reconstruction8(self, weight_Y, GlobalA_mixer_Y, \
                    self.GlobalPCA_dewhite_Y, self.Con_deWhite_Y, self.NSUB_All_Y, self.NCOM_All_Y, SITE_NUM, B_GLOBAL, True))

                mx_test = copy.copy (LocalA_All_X_test)
                sx_test = copy.copy (LocalA_All_Y_test)
                Corr_matrix_test = np.abs(ica_fuse_corr(self, mx_test,sx_test))  # 8 x 8

                #  % calculate the correlation of all componentsts   % match tow modality components
                j_min_test = copy.copy(min(int(self.NCOM_X),int(self.NCOM_Y)))
                maxcorr_test =np.zeros(j_min_test)
                maxcol_test =np.zeros(j_min_test)
                maxrow_test =np.zeros(j_min_test)

                for j in range(j_min)  :
                    [mm,ss] = copy.copy(np.unravel_index(np.argmax(Corr_matrix_test, axis=None), Corr_matrix_test.shape))
                    maxcol_test[j] = copy.copy(mm)
                    maxrow_test[j] = copy.copy(ss)
                    maxcorr_test[j] = copy.copy(Corr_matrix_test[mm,ss])
                    Corr_matrix_test[mm,:]=0
                    Corr_matrix_test[:,ss]=0
                mymaxcorr_test =  maxcorr_test[0]

                costfunction_corrcoef_list_maxcorr_test_XY.append([Loop_num, maxcorr_test[0]])


                if maxcorr_test[0] < maxcorr[0] :
                    printme = printme + "Wrong direction !!!! "  + "\n"
                    printme = printme + "\n"
                    
                # end if
                #lossf3(max(STEP_X, STEP_Y)) = abs (temp)  # Not exist
                #%             -----------------end test
                oldweight_Y = copy.copy (weight_Y) # 8x8
                oldweight_X = copy.copy (weight_X) # 8x8
                # print('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update] Testing and validating ===== Finish =====')

            #end if ~ isempty(ix) :


        # Entropy
        else :
            costfunction_corrcoef_list_maxcorr_XY.append([Loop_num, 0])
            costfunction_corrcoef_list_maxcorr_test_XY.append([Loop_num,0])  

        # end if if (STEP_X >2 and STEP_Y > 2) and ( not STOPSIGN_X or not STOPSIGN_Y ) 


        if STOPSIGN_X == 1 and STOPSIGN_Y == 1 :
            laststep = max(STEP_X, STEP_Y)
            STEP_LAST_X = STEP_X
            STEP_LAST_Y = STEP_Y
            STEP_X = maxsteps                #% stop when weights stabilize
            STEP_Y = maxsteps
        # end if 
        

        #
        # Parrelle ICA - Global Weight update
        #
        # ('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update]=====Start=====')

        # Parallel ICA - Update Global Weight of all Modality from Global A mixer
        # ('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update]=====Update Global Weight of all Modality from Global A mixer=====')

        GlobalW_unmixer_X = copy.copy (weight_X)
        GlobalW_unmixer_Y = copy.copy (weight_Y)

        # ('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update]=====End=====')
    
        Loop_num = Loop_num + 1

    # End of IF Flow 6 - Flow 8a


    # End while (STEP_X < maxsteps or STEP_Y < maxsteps) :
    ###########################################################################

    # %%%%%%%%%%%%%% Orient components towards positive activation %%%%%%%%%%%
    # %

    GlobalW_unmixer_X = copy.copy (weight_X)
    GlobalW_unmixer_Y = copy.copy (weight_Y)


    # Save all list into files.
    import datetime
    today = datetime.datetime.today() 
    YYYYMMDD = today.strftime('%Y%m%d%H%M')
    # np.savetxt( self.state['outputDirectory'] + "/Loop_list" + "_" + YYYYMMDD +".csv", Loop_list, delimiter=",")
    # np.savetxt( self.state['outputDirectory'] + "/Loop_list_X" + "_" + YYYYMMDD +".csv", Loop_list_X, delimiter=",")
    # np.savetxt( self.state['outputDirectory'] + "/Loop_list_Y" + "_" + YYYYMMDD +".csv", Loop_list_Y, delimiter=",")
    # np.savetxt( self.state['outputDirectory'] + "/STEP_list_X" + "_" + YYYYMMDD +".csv", STEP_list_X, delimiter=",")
    # np.savetxt( self.state['outputDirectory'] + "/STEP_list_Y" + "_" + YYYYMMDD +".csv", STEP_list_Y, delimiter=",")
    # np.savetxt( self.state['outputDirectory'] + "/STOPSIGN_list_X" + "_" + YYYYMMDD +".csv", STOPSIGN_list_X, delimiter=",")
    # np.savetxt( self.state['outputDirectory'] + "/STOPSIGN_list_Y" + "_" + YYYYMMDD +".csv", STOPSIGN_list_Y, delimiter=",")
    # np.savetxt( self.state['outputDirectory'] + "/Crate_list_X" + "_" + YYYYMMDD +".csv", Crate_list_X, delimiter=",")
    # np.savetxt( self.state['outputDirectory'] + "/Crate_list_Y" + "_" + YYYYMMDD +".csv", Crate_list_Y, delimiter=",")
    # np.savetxt( self.state['outputDirectory'] + "/entropy_list_X" + "_" + YYYYMMDD +".csv", entropy_list_X, delimiter=",")
    # np.savetxt( self.state['outputDirectory'] + "/entropy_list_Y" + "_" + YYYYMMDD +".csv", entropy_list_Y, delimiter=",")
    # np.savetxt( self.state['outputDirectory'] + "/entropychange_list_X" + "_" + YYYYMMDD +".csv", entropychange_list_X, delimiter=",")
    # np.savetxt( self.state['outputDirectory'] + "/entropychange_list_Y" + "_" + YYYYMMDD +".csv", entropychange_list_Y, delimiter=",")
    # np.savetxt( self.state['outputDirectory'] + "/costfunction_corrcoef_list_maxcorr_XY" + "_" + YYYYMMDD +".csv", costfunction_corrcoef_list_maxcorr_XY, delimiter=",")
    # np.savetxt( self.state['outputDirectory'] + "/costfunction_corrcoef_list_maxcorr_test_XY" + "_" + YYYYMMDD +".csv", costfunction_corrcoef_list_maxcorr_test_XY, delimiter=",")

    self.mymaxcorr_list.append([self.RUN_NUMBER, round(mymaxcorr,4)])   
    self.myentropy_list_X.append([self.RUN_NUMBER, round(myentropy_X,4)])   
    self.myentropy_list_Y.append([self.RUN_NUMBER, round(myentropy_Y,4)])   
    self.mySTEP_list_X.append([self.RUN_NUMBER, STEP_LAST_X])   
    self.mySTEP_list_Y.append([self.RUN_NUMBER, STEP_LAST_Y])   
    self.RUN_NUMBER = self.RUN_NUMBER + 1

    if ((change_X  > nochange) or (change_Y > nochange)) : 
        if ( (STEP_X) == (maxsteps)  or (STEP_Y) == (maxsteps) ):
            printme = printme + "!!!Reached max steps. Please reduce the constrained components in setup options and restart parallel ica."  + "\n"
        # end if
    # end if

    printme = printme + "[LOG]=====INFOMAX=====Current_STEP_X = " + str(STEP_LAST_X) + " and STEP_Y  =" + str(STEP_LAST_Y) + \
        "STOPSIGN_X = " + str(STOPSIGN_X) + " STOPSIGN_Y  = " + str(STOPSIGN_Y) + "\n"

    # ('INFOMAX...Return====A,S,W,STEP,STOPSIGN as inv(weights), dot(weights, x_white), weights, STEP, STOPSIGN.===')
    printme = printme + "[LOG]=====INFOMAX=====Finish" + "\n"

    printme = printme + "[LOG][Flow_5_Global_ICA]" + "\n"
    printme = printme + "[LOG][Flow_6_Parallel_ICA-Local_reconstruction]" + "\n"
    printme = printme + "[LOG][Flow_7_Parallel_ICA-Correlation_A]" + "\n"
    printme = printme + "[LOG][Flow_8_Parallel_ICA-Global_reconstruction]" + "\n"
    printme = printme + "[LOG][Flow_8a_Parallel_ICA-Global_Weight_update]" + "\n"

    printme = printme + "[LOG][Flow_8a_Parallel_ICA-Global] Save all A, W, S cvs files." + "\n"
    printme = printme + "[LOG][Flow_8a_Parallel_ICA-Global] Finish run " + str(self.run) + ".\n"
    printme = printme + "DATA_PATH_OUTPUT = " + str(self.state['outputDirectory']) + "\n"
    printme = printme + "maxcorr = " + str(self.mymaxcorr_list) + "\n"
    printme = printme + "ENTROPY_X =  " + str(self.myentropy_list_X) + "\n"
    printme = printme + "ENTROPY_Y =  " + str(self.myentropy_list_Y) + "\n"
    printme = printme + "STEP_X =  " + str(self.mySTEP_list_X) + "\n"
    printme = printme + "STEP_Y =  " + str(self.mySTEP_list_Y) + "\n"
    printme = printme + "======================================" + "\n"


    self.cache['logs'].append(printme + "\n")

    return (GlobalW_unmixer_X, sphere_X, GlobalW_unmixer_Y, sphere_Y )


