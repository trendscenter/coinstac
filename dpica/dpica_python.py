'''
Reference: Parallel Independent Component Analysis (pICA): (Liu et al. 2009)

Code deverloper : cpanichvatana1@student.gsu.edu
Version : 4.0 on 6/18/2021

'''
import numpy as np
from numpy import dot
from numpy.linalg import matrix_rank, inv, matrix_rank

from numpy.random import permutation
from scipy.linalg import eigh,  sqrtm, eig
from scipy.sparse.linalg import eigsh
from scipy.stats import t
from scipy.linalg import sqrtm
from scipy.linalg import norm as mnorm
import time
import unittest
import dpica_mask
import dpica_report
import matplotlib.pyplot as plt
import math
import os
from datetime import datetime, timedelta


# Global PATHs
b_mask_creation = False         # Boolean to define if mask file creation is needed to create.
MASK_FILE_location = "/data/users2/cpanichvatana1/dataset/ABCD/Mask/ABCD_mask_fmri_dpica_v1.nii.gz"
MASK_PATH_X = "/data/users2/cpanichvatana1/dataset/ABCD/Mask/"  
MODALITY_Y_RAW_FILE_NAME = "ABCD_impQCed_maf0p01_new_rsnum_updated_clear5_prune0p5_recode.raw"
DATA_PATH_FROM_FILE = "/data/users2/cpanichvatana1/dataset/ABCD/Clean_data/100/"
DATA_PATH_X = "/data/collaboration/NeuroMark2/Data/ABCD/Data_BIDS/Raw_Data/"
DATA_PATH_Y = "/data/users2/cpanichvatana1/dataset/ABCD/ImputedSNP_QC2"
DATA_PATH_OUTPUT = "/data/users2/cpanichvatana1/dataset/output/output1_siteAll100_99/"  
DATA_SITES_X = "/data/users2/cpanichvatana1/dataset/ABCD/Data_BIDS/"
DATA_SITES = "siteAll100.txt"          


# Global constants
MAX_W = 1000000000.0
ANNEAL = 0.90        # if weights blowup, restart with lrate
MAX_STEP = 200  # 1200


##############  Declare defaults used below   ##############
MAX_WEIGHT           = 1e8;       # guess that weights larger than this have blown up
DEFAULT_STOP         = 0.000001;  # stop training if weight changes below this
DEFAULT_ANNEALDEG    = 60;        # when angle change reaches this value,
DEFAULT_ANNEALSTEP   = 0.90;      # anneal by multiplying lrate by this original 0,9 to 0.95 changed by JL
DEFAULT_EXTANNEAL    = 0.98;      # or this if extended-ICA
DEFAULT_MAXSTEPS     = MAX_STEP # 512;       # ]top training after this many steps 512
DEFAULT_MOMENTUM     = 0.0;       # default momentum weight

DEFAULT_BLOWUP       = 1000000000.0;   # = learning rate has 'blown up'
DEFAULT_BLOWUP_FAC   = 0.8;       # when lrate 'blows up,' anneal by this fac
DEFAULT_RESTART_FAC  = 0.9;       # if weights blowup, restart with lrate
# lower by this factor
MIN_LRATE            = 0.000001;  # if weight blowups make lrate < this, quit
MAX_LRATE            = 0.1;       # guard against uselessly high learning rate

# Extended-ICA option:
DEFAULT_EXTENDED     = 0;         # default off
DEFAULT_EXTBLOCKS    = 1;         # number of blocks per kurtosis calculation
DEFAULT_NSUB         = 1;         # initial default number of assumed sub-Gaussians
# for extended-ICA
DEFAULT_EXTMOMENTUM  = 0.5;       # momentum term for computing extended-ICA kurtosis
MAX_KURTSIZE         = 6000;      # max points to use in kurtosis calculation
MIN_KURTSIZE         = 2000;      # minimum good kurtosis size (flag warning)
SIGNCOUNT_THRESHOLD  = 25;        # raise extblocks when sign vector unchanged
# after this many steps
SIGNCOUNT_STEP       = 2;         # extblocks increment factor

DEFAULT_SPHEREFLAG   = 'on';      # use the sphere matrix as the default
#   starting weight matrix
DEFAULT_PCAFLAG      = 'off';     # don't use PCA reduction
DEFAULT_POSACTFLAG   = 'on';      # use posact()
DEFAULT_VERBOSE      = 1;         # write ascii info to calling screen
DEFAULT_BIASFLAG     = 1;         # default to using bias in the ICA update rule

#--constrained ICA parameters
CONSTRAINED_COMPONENTS = 3; # NUMBER OF COMPONENTS FROM EACH DATASET BEING CONSTRAINED
CONSTRAINED_CONNECTION =   1   # 0.2542   #1  #0.5; # CORRELATION THRESHOLD TO BE CONSTRAINED; HIGH THRESHOLD WILL BE STRENGTHENED.
CONSTRAINED_CONNECTION_PROABILITY = 0.025
ENDURANCE = -1e-3; # the maximumlly allowed descending trend of entropy;

ICA_RUN_NUMBER =  1
    # AVG
# ICA_RUN_AVERAGE = True
# ICA_RUN_ICASSO = False
    # ICASSO
ICA_RUN_AVERAGE = False
ICA_RUN_ICASSO = True


##############  Set up keyword default values  ##############


epochs = 1;							 # do not care how many epochs in data

pcaflag    = DEFAULT_PCAFLAG;
sphering   = DEFAULT_SPHEREFLAG;     # default flags
posactflag = DEFAULT_POSACTFLAG;
verbose    = DEFAULT_VERBOSE;
annealdeg  = DEFAULT_ANNEALDEG;
annealstep = 0;                      # defaults declared below
nochange   = DEFAULT_STOP;
momentum   = DEFAULT_MOMENTUM;
maxsteps   = DEFAULT_MAXSTEPS;

weights    = 0;                      # defaults defined below
biasflag   = DEFAULT_BIASFLAG;

DEFAULT_EXTENDED   = DEFAULT_EXTENDED;
extblocks  = DEFAULT_EXTBLOCKS;
kurtsize_X   = MAX_KURTSIZE
kurtsize_Y   = MAX_KURTSIZE
signsbias  = 0.02;                   # bias towards super-Gaussian components
extmomentum= DEFAULT_EXTMOMENTUM;    # exp. average the kurtosis estimates
nsub       = DEFAULT_NSUB;

wts_blowup_X = 0;                      # flag =1 when weights too large
wts_blowup_Y = 0;                      # flag =1 when weights too large

wts_passed = 0;                      # flag weights passed as argument

Connect_threshold =CONSTRAINED_CONNECTION; # set a threshold to select columns constrained.
MaxComCon  =       CONSTRAINED_COMPONENTS
trendPara  = ENDURANCE; #depends on the requirement on connection; the more negative,the stronger the contrains ,that may cause overfitting


X_x_size = 53       # Given ABCD fMIR size
X_y_size = 63       # Given ABCD fMIR size
X_z_size = 46       # Given ABCD fMIR size
NCOM_X = 8
NCOM_Y = 8

class test_ica_methods(unittest.TestCase):

    def setUp(self):

        print('==============Global Parameters==============')
        print('MASK_FILE_location = ', MASK_FILE_location)
        print('MODALITY_Y_RAW_FILE_NAME = ', MODALITY_Y_RAW_FILE_NAME)
        print('DATA_PATH_X = ', DATA_PATH_X)
        print('MASK_PATH_X = ', MASK_PATH_X)
        print('DATA_PATH_Y = ', DATA_PATH_Y)
        print('DATA_PATH_FROM_FILE = ', DATA_PATH_FROM_FILE)
        print('DATA_PATH_OUTPUT = ', DATA_PATH_OUTPUT)
        print('DATA_SITES_X = ', MASK_FILE_location)
        print('MASK_FILE_location = ', MASK_FILE_location)
        print('DEFAULT_EXTENDED = ', DEFAULT_EXTENDED)
        print('DEFAULT_EXTBLOCKS = ', DEFAULT_EXTBLOCKS)
        print('DEFAULT_NSUB = ', DEFAULT_NSUB)
        print('DEFAULT_EXTMOMENTUM = ', DEFAULT_EXTMOMENTUM)
        print('MAX_KURTSIZE = ', MAX_KURTSIZE)
        print('MIN_KURTSIZE = ', MIN_KURTSIZE)
        print('SIGNCOUNT_THRESHOLD = ', SIGNCOUNT_THRESHOLD)
        print('DEFAULT_SPHEREFLAG = ', DEFAULT_SPHEREFLAG)
        print('DATA_SDEFAULT_PCAFLAGITES = ', DEFAULT_PCAFLAG)
        print('DEFAULT_POSACTFLAG = ', DEFAULT_POSACTFLAG)
        print('DEFAULT_VERBOSE = ', DEFAULT_VERBOSE)
        print('DEFAULT_BIASFLAG = ', DEFAULT_BIASFLAG)
        print('CONSTRAINED_COMPONENTS = ', CONSTRAINED_COMPONENTS)
        print('CONSTRAINED_CONNECTION = ', CONSTRAINED_CONNECTION)
        print('DATA_ENDURANCESITES = ', ENDURANCE)
        print('NCOM_X = ', NCOM_X)
        print('NCOM_Y = ', NCOM_Y)
        print('signsbias = ', signsbias)
        print('MAX_W = ', MAX_W)
        print('ANNEAL = ', ANNEAL)
        print('MAX_STEP = ', MAX_STEP)
        print('DATA_SITES = ', DATA_SITES)
        print('ICA_RUN_NUMBER = ', ICA_RUN_NUMBER)
        print('ICA_RUN_AVERAGE = ', ICA_RUN_AVERAGE)
        print('ICA_RUN_ICASSO = ', ICA_RUN_ICASSO)

        # setUp is to import all data. 
        # ABCD 
        # - Modality X (Data1) from fmri - . img
        # /data/collaboration/NeuroMark2/Data/ABCD/Data_BIDS/Raw_Data/”subjects”/baseline/anat_xxx/Sm6mwc1pti.nii
        # - Modality Y (Data2) from gene - .asc
        #  ABCD_mind0p2_HM3mds100.mds.csv  (By  Kuaikuai Duan <kduan@gsu.edu>)

        #Setup        
        print('[LOG][def_setUp]+++++Set up start+++++')
        self.NCOM_X = NCOM_X  
        self.NCOM_Y = NCOM_Y  
        self.STEP=[0,0]
        self.maxsteps = maxsteps
        self.STOPSIGN=[0,0]
        if not os.path.exists(DATA_PATH_OUTPUT):
            os.makedirs(DATA_PATH_OUTPUT)



        print('[LOG][Flow_1_Setup]=====Creating default mask - Start =====')     
        #
        # Create mask file
        #
        # b_mask_creation = True
        b_mask_creation = False

        # Initial parameter values
        mask_file_location = MASK_FILE_location
        x_size = X_x_size
        y_size = X_y_size
        z_size = X_z_size
        if b_mask_creation :
            data_path = DATA_PATH_X
            mask_path = MASK_PATH_X 
                                 
            mask_file_location, x_size, y_size, z_size = dpica_mask.pica_mask_creation3(data_path, \
                 mask_path, b_plot_mask=False, b_plot_nii=False)

        print('[LOG][Flow_1_Setup]=====Creating default mask - End  =====')      



        # Loading Local Modality_X 
        print('[LOG][Flow_1_Setup]=====Loading Local Modality_X - Start =====')        
        
        # Option 1 from cvs file
        b_Modality_creation_X = True
        # b_Modality_creation_X = False
        if b_Modality_creation_X :
            print('[LOG][Flow_1_Setup]=====Loading Local Modality_X - From file =====')        
            ini_time = datetime.now()

            data_path_from_file = DATA_PATH_FROM_FILE
            file_name = "clean_data_X1.csv"                
            self.clean_data_X1, self.NSUB_X1, self.NVOX_X1 , self.NCOM_X1 = \
                dpica_mask.pica_Modality_X_creation_from_file1(self.NCOM_X, data_path_from_file, \
                    file_name, x_size, y_size)        

            print('[LOG][Flow_1_Setup]=====Loading Local Modality_X - Loaded time is ' , str(datetime.now() - ini_time) ,  '=====')    



        # Option 2 from ABCD folder
        # b_Modality_creation_X = True
        b_Modality_creation_X = False
        if b_Modality_creation_X : 
            data_path = DATA_PATH_X
            data_site_path = DATA_SITES_X
            data_sites = DATA_SITES
            self.clean_data_X1, self.clean_folder_file_name_data_X1, self.NSUB_X1, self.NVOX_X1 , self.NCOM_X1 = \
                dpica_mask.pica_masked_Modality_X_creation4(self.NCOM_X, data_path, data_site_path, data_sites, \
                    mask_file_location, x_size, y_size, z_size)
            np.savetxt( DATA_PATH_OUTPUT + "clean_data_X1.csv", self.clean_data_X1, delimiter=",")
     
            self.NCOM_X = self.NCOM_X1  
            

        # Loading Local Modality_Y
        print('[LOG][Flow_1_Setup]=====Loading Local Modality_Y - Start =====')        



        # Option 1 from cvs file
        # b_Modality_creation_Y = False
        b_Modality_creation_Y = True
        if b_Modality_creation_Y :
            print('[LOG][Flow_1_Setup]=====Loading Local Modality_Y - From file =====')     
            ini_time = datetime.now()

            data_path_from_file = DATA_PATH_FROM_FILE
            file_name = "clean_data_Y1.csv"     # Site Y All            
            self.clean_data_Y1, self.NSUB_Y1, self.NVOX_Y1 , self.NCOM_Y1 = \
                dpica_mask.pica_Modality_Y_creation_from_file1(self.NCOM_Y, data_path_from_file, \
                    file_name, x_size, y_size)


        # Option 2 from ABCD folder
        # b_Modality_creation_Y = True
        b_Modality_creation_Y = False
        if b_Modality_creation_Y :
            data_path = DATA_PATH_Y   
            snp_file_name = MODALITY_Y_RAW_FILE_NAME

            self.clean_data_Y1, self.NSUB_Y1, self.NVOX_Y1 , self.NCOM_Y1 = \
                dpica_mask.pica_Modality_Y_creation2(self.NCOM_Y, data_path, \
                    snp_file_name, self.clean_folder_file_name_data_X1, x_size, y_size)

            np.savetxt( DATA_PATH_OUTPUT + "clean_data_Y1.csv", self.clean_data_Y1, delimiter=",")

            self.NCOM_Y = self.NCOM_Y1   

        print('[LOG][Flow_1_Setup]=====Loading Local Modality_Y - Finish =====')    



        #Print initial parameter number        
        print('[LOG][Flow_1_Setup]=====Print initial parameter number=====')    
        print('NSUB_X1 N_X1 = ', self.NSUB_X1, 'NVOX_X1  d_X1 = ' , self.NVOX_X1, 'NCOM_X1  r_X1 = ', self.NCOM_X1  )
        # print('NSUB_X2 N_X2 = ', self.NSUB_X2, 'NVOX_X2  d_X2 = ' , self.NVOX_X2, 'NCOM_X2  r_X2 = ', self.NCOM_X2  )
        # print('NSUB_X3 N_X3 = ', self.NSUB_X3, 'NVOX_X3  d_X3 = ' , self.NVOX_X3, 'NCOM_X3  r_X3 = ', self.NCOM_X3  )

        print('NSUB_Y1 N_Y1 = ', self.NSUB_Y1, 'NVOX_Y1  d_Y1 = ' , self.NVOX_Y1, 'NCOM_Y1  r_Y1 = ', self.NCOM_Y1  )
        # print('NSUB_Y2 N_Y2 = ', self.NSUB_Y2, 'NVOX_Y2  d_Y2 = ' , self.NVOX_Y2, 'NCOM_Y2  r_Y2 = ', self.NCOM_Y2  )
        # print('NSUB_Y3 N_Y3 = ', self.NSUB_Y3, 'NVOX_Y3  d_Y3 = ' , self.NVOX_Y3, 'NCOM_Y3  r_Y3 = ', self.NCOM_Y3  )        

        #
        # Define Modality X data
        #
        print('[LOG][Flow_1_Setup]=====Modality_X Set up Start=====')                
        # Modality_X Setting up X_X = A_X ∙ S_X
        self.S_X1 = np.random.logistic(0, 1, (self.NCOM_X1, self.NVOX_X1))
        self.A_X1 = np.random.normal(0, 1, (self.NSUB_X1, self.NCOM_X1))
        # self.S_X2 = np.random.logistic(0, 1, (self.NCOM_X2, self.NVOX_X2))
        # self.A_X2 = np.random.normal(0, 1, (self.NSUB_X2, self.NCOM_X2))
        # self.S_X3 = np.random.logistic(0, 1, (self.NCOM_X3, self.NVOX_X3))
        # self.A_X3 = np.random.normal(0, 1, (self.NSUB_X3, self.NCOM_X3))

        #
        # Define Modality Y data
        #
        print('[LOG][Flow_1_Setup]=====Modality_Y Set up Start=====')  
        # Modality_Y Setting up X_Y = A_Y ∙ S_Y         
        self.S_Y1 = np.random.logistic(0, 1, (self.NCOM_Y1, self.NVOX_Y1))
        # self.A_Y1 = np.random.normal(0, 1, (self.NSUB_Y1, self.NCOM_Y1))
        # self.S_Y2 = np.random.logistic(0, 1, (self.NCOM_Y2, self.NVOX_Y2))
        # self.A_Y2 = np.random.normal(0, 1, (self.NSUB_Y2, self.NCOM_Y2))
        # self.S_Y3 = np.random.logistic(0, 1, (self.NCOM_Y3, self.NVOX_Y3))
        # self.A_Y3 = np.random.normal(0, 1, (self.NSUB_Y3, self.NCOM_Y3))

        # Print all Modality data
        print('[LOG][Flow_1_Setup]=====Print all Modality data=====')  
        print('Modality_X1 Input===X_X1.shape (N_X1 x d_X1)',self.clean_data_X1.shape , 'NCOMP_X1 (r_X1) = ', self.NCOM_X1  )       
        # print('Modality_X2 Input===X_X2.shape (N_X2 x d_X2)',self.clean_data_X2.shape , 'NCOMP_X2 (r_X2) = ', self.NCOM_X2  )    
        # print('Modality_X3 Input===X_X3.shape (N_X3 x d_X3)',self.clean_data_X3.shape , 'NCOMP_X3 (r_X3) = ', self.NCOM_X3  )    

        print('Modality_Y1 Input===X_Y1.shape (N_Y1 x d_Y1)',self.clean_data_Y1.shape , 'NCOMP_Y1 (r_Y1) = ', self.NCOM_Y1  )       
        # print('Modality_Y2 Input===X_Y2.shape (N_Y2 x d_Y2)',self.clean_data_Y2.shape , 'NCOMP_Y2 (r_Y2) = ', self.NCOM_Y2  )    
        # print('Modality_Y3 Input===X_Y3.shape (N_Y3 x d_Y3)',self.clean_data_Y3.shape , 'NCOMP_Y3 (r_Y3) = ', self.NCOM_Y3  )    


        # print('[LOG][def_setUp]+++++Set up finish+++++')
        return (self)

    def p_to_r2(self, N):

        prb = CONSTRAINED_CONNECTION_PROABILITY
        df = N - 2
        x = abs(t.ppf(prb, df))   
        r = math.sqrt(1/((N-2) + x**x))*x
        return(r)

    def norm(self, x):
        """Computes the norm of a vector or the Frobenius norm of a
        matrix_rank

        """
        return mnorm(x.ravel())

    def diagsqrts(self, w):
        """
        Returns direct and inverse square root normalization matrices
        """
        Di = np.diag(1. / (np.sqrt(w) + np.finfo(float).eps))
        D = np.diag(np.sqrt(w))
        return D, Di

    def pca_whiten2(self, x2d, n_comp, verbose=True):
        """ data Whitening
        *Input
        x2d : 2d data matrix of observations by variables
        n_comp: Number of components to retain
        *Output
        Xwhite : Whitened X
        white : whitening matrix (Xwhite = np.dot(white,X))
        dewhite : dewhitening matrix (X = np.dot(dewhite,Xwhite))
        """
        # PCA...Start    
        # print("PCA...Start")      
        x2d_demean = x2d - x2d.mean(axis=1).reshape((-1, 1))  # Remove mean by row
        # x2d_demean = x2d - x2d.mean(axis=0).reshape((-1, 1))        
        NSUB, NVOX = x2d_demean.shape
        if NSUB > NVOX:
            cov = np.dot(x2d_demean.T, x2d_demean) / (NSUB - 1)
            w, v = eigh(cov, eigvals=(NVOX - n_comp, NVOX - 1))    
            D, Di = self.diagsqrts(w)
            u = np.dot(dot(x2d_demean, v), Di)
            x_white = v.T
            white = np.dot(Di, u.T)
            dewhite = np.dot(u, D)
        else:
            # print("PCA...cov++')            
            cov = np.dot(x2d_demean, x2d_demean.T) / (NVOX - 1)
            # print("PCA...Eigenvector++')            
            w, u = eigh(cov, eigvals = (NSUB - n_comp, NSUB - 1))
            # print("PCA...w eigenvalue rx1',w.shape )
            # print("PCA...u eigenvector Nxr ',u.shape)           
            D, Di = self.diagsqrts(w)
            # print("PCA...diagsqrts(w)=D rxr',D.shape )
            # print("PCA...white=Whitening X')           
            white = np.dot(Di, u.T)
            x_white = np.dot(white, x2d_demean)
            # print("PCA...white=x_white (rxd)',x_white.shape )         
            dewhite = np.dot(u, D)
            # print("PCA...white=dewhite (Nxr)',dewhite.shape )

            # Check_I_w = np.dot(white, dewhite)

            # Return
            # print("PCA...return====x_white, white, dewhite ===')   
            # print("PCA...Finish')      
        return (x_white, white, dewhite)

    def pca_whiten3(self, x2d, n_comp, verbose=True):
        """ data Whitening
        *Input
        x2d : 2d data matrix of observations by variables
        n_comp: Number of components to retain
        *Output
        Xwhite : Whitened X
        white : whitening matrix (Xwhite = np.dot(white,X))
        dewhite : dewhitening matrix (X = np.dot(dewhite,Xwhite))
        *PCA without removing mean
        """
        # PCA...Start    
        # print("PCA...Start")      
        # x2d_demean = x2d - x2d.mean(axis=1).reshape((-1, 1))  # Remove mean
            # tempVar = ones(size(currentData, 1), 1)*mean(currentData);
            # currentData = currentData - tempVar;

        x2d = x2d
        # x2d = x2d - x2d.mean(axis=0).reshape((-1, 1))        
        NSUB, NVOX = x2d.shape
        if NSUB > NVOX:
            cov = np.dot(x2d.T, x2d) / (NSUB - 1)    
            w, v = eigh(cov, eigvals=(NVOX - n_comp, NVOX - 1))    
            D, Di = self.diagsqrts(w)
            u = np.dot(dot(x2d, v), Di)
            x_white = v.T
            white = np.dot(Di, u.T)
            dewhite = np.dot(u, D)
        else:
            # print("PCA...cov++')            
            cov = np.dot(x2d, x2d.T) / (NVOX - 1)  # (43, 58179) x (58179, 43) = (43, 43)  #  ica_fuse_cov : A = A ./ (m - 1)  #(12, 110)
            # print("PCA...Eigenvector++')            
            w, u = eigh(cov, eigvals = (NSUB - n_comp, NSUB - 1))
            # print("PCA...w eigenvalue rx1',w.shape )
            # print("PCA...u eigenvector Nxr ',u.shape)           # This u must be identity matrix
            D, Di = self.diagsqrts(w) # Return direct and inverse square root normalization matrices
            # print("PCA...diagsqrts(w)=D rxr',D.shape )
            # print("PCA...white=Whitening X')           
            white = np.dot(Di, u.T)         # whiteningMatrix = sqrtm(Lambda) \ V'; % Use gaussian elimination approach to solve the equations
            x_white = np.dot(white, x2d)         # newVectors = data * whiteningMatrix'; newVectors = newVectors';
            # print("PCA...white=x_white (rxd)',x_white.shape )         
            dewhite = np.dot(u, D)          # dewhiteningMatrix = V * sqrtm(Lambda);
            # print("PCA...white=dewhite (Nxr)',dewhite.shape )

            # Check_I_w = np.dot(white, dewhite)

            # Return
            # print("PCA...return====x_white, white, dewhite ===')   
            # print("PCA...Finish')      
        return (x_white, white, dewhite)

    def weight_update3(self, weights, x_white, bias1, lrate1):
        """ Update rule for infomax
        This function recieves parameters to update W1
        * Input
        W1: unmixing matrix (must be a square matrix)
        Xwhite1: whitened data
        bias1: current estimated bias
        lrate1: current learning rate
        startW1: in case update blows up it will start again from startW1
        * Output
        W1: updated mixing matrix
        bias: updated bias
        lrate1: updated learning rate
        """
        NCOMP, NVOX = x_white.shape
        block1 = int(np.floor(np.sqrt(NVOX / 3)))
        permute1 = permutation(NVOX)
        for start in range(0, NVOX, block1):
            if start + block1 < NVOX:
                tt2 = start + block1
            else:
                tt2 = NVOX
                block1 = NVOX - start

            unmixed = dot(weights, x_white[:, permute1[start:tt2]]) + bias1
            logit = 1 - (2 / (1 + np.exp(-unmixed)))
            weights = weights + lrate1 * dot(
                block1 * np.eye(NCOMP) + dot(logit, unmixed.T), weights)
            bias1 = bias1 + lrate1 * logit.sum(axis=1).reshape(bias1.shape)
            # Checking if W blows up
            if (np.isnan(weights)).any() or np.max(np.abs(weights)) > MAX_W:
                # print("Numeric error! restarting with lower learning rate")
                print("Weight is outside the range. Restarting.")
                lrate1 = lrate1 * ANNEAL
                weights = np.eye(NCOMP)
                bias1 = np.zeros((NCOMP, 1))
                error = 1

                if lrate1 > 1e-6 and \
                matrix_rank(x_white) < NCOMP:
                    print("Data 1 is rank defficient"
                        ". I cannot compute " +
                        str(NCOMP) + " components.")
                    return (None, None, None, 1)

                if lrate1 < 1e-6:
                    print("Weight matrix may"
                        " not be invertible...")
                    return (None, None, None, 1)
                break
            else:
                error = 0

        return (weights, bias1, lrate1, error)

    def local_reconstruction3(self, GlobalA_mixer, Global_deWhite, Con_deWhite, NSUB_All, NCOM_All, verbose=False):
        """Computes local A using Global_deWhite and Concatenated_local_deWhite
        *Input
        GlobalA_mixer_X : ICA's Mixing matrix or Loading parameter matrix : srxr
        Global_deWhite :  Global deWhitening and output of Global PCA : srxr 
        Concatenated_local_deWhite :  Concatenate L_deWh to Con_deWh: sNxr
        NSUB_All : All subject numbers of each sites in this Modality 
        NCOM_All : All component numbers of each sites in this Modality     
        verbose: flag to print optimization updates
        *Output
        LocalA : Local mixing matrix : sNxr
        """

        # 1) Find Local_deWhite  N x r
        L_dWh_1 = Con_deWhite[:int(NSUB_All[0]), :]         # 1) Find Local_deWhite  N x r

        # 2) Find [Local white A (All) sr x r] from [Glo_deWhite sr x r ] * [Glo_A r x r ]              # Global_deWhite = I matrix  r x r = rxr * rxr
        LocalA_Wh_All = np.dot(Global_deWhite, GlobalA_mixer) #  2) Find Local white A (All) from Glo_deWhite x Glo_A     # Global_deWhite = I matrix  r x r = rxr * rxr

        # 3) Find/Seperate each Local_White_A  r x r 
        Local_Wh_A_1 = LocalA_Wh_All[:int(NCOM_All[0]), :]  # 3) Find/Seperate each Local_White_A  r x r 

        # 4) Find Local_A  N x r   : Nxr * rxr by [1)dewhite N x r] * [3) local_A r x r]
        LocalA_1 = np.dot(L_dWh_1, Local_Wh_A_1)            # 4) Find Local_A  N x r   : Nxr * rxr by [1)dewhite N x r] * [3) local_A r x r]

        # 5) Concatenate LocalA_All sN x r = np.concatenate((LocalA_1),axis = 0)
        LocalA_All = (LocalA_1)
     
        return (LocalA_All)

    def local_reconstruction4(self, GlobalA_mixer, Global_deWhite, Con_deWhite, NSUB_All, NCOM_All, verbose=False):
        """Computes local A using Global_deWhite and Concatenated_local_deWhite
        *Input
        GlobalA_mixer_X : ICA's Mixing matrix or Loading parameter matrix : srxr
        Global_deWhite :  Global deWhitening and output of Global PCA : srxr 
        Concatenated_local_deWhite :  Concatenate L_deWh to Con_deWh: sNxr
        NSUB_All : All subject numbers of each sites in this Modality 
        NCOM_All : All component numbers of each sites in this Modality     
        verbose: flag to print optimization updates
        *Output
        LocalA : Local mixing matrix : sNxr
        """



        # print("Local_Reconstruction...Start")      
        # 1) Find Local_deWhite  N x r
        # print("Local_Reconstruction...Initialization")    
        # print("Local_Reconstruction...NSUB_All =", NSUB_All) 
        # 1 site
        L_dWh_1 = Con_deWhite[:int(NSUB_All[0]), :]
        # # 3 sites
        # L_dWh_2 = Con_deWhite[int(NSUB_All[0]):(int(NSUB_All[0])+int(NSUB_All[1])), :]
        # L_dWh_3 = Con_deWhite[(int(NSUB_All[0])+int(NSUB_All[1])):, :]

        # print ("L_dWh_1.shape = ", L_dWh_1.shape)
        # print (L_dWh_2.shape)
        # print (L_dWh_3.shape)

        # 2) Find [Local white A (All) sr x r] from [Glo_deWhite sr x r ] * [Glo_A r x r ] 
        LocalA_Wh_All = dot(Global_deWhite, GlobalA_mixer)

        # 3) Find/Seperate each Local_White_A  r x r 
        Local_Wh_A_1 = LocalA_Wh_All[:int(NCOM_All[0]), :]
        # # 3 sites
        # Local_Wh_A_2 = LocalA_Wh_All[int(NCOM_All[0]):(int(NCOM_All[0])+int(NCOM_All[1])), :]
        # Local_Wh_A_3 = LocalA_Wh_All[(int(NCOM_All[0])+int(NCOM_All[1])):, :]
        # print ("Local_Wh_A_1.shape = ", Local_Wh_A_1.shape)
        # print (Local_Wh_A_2.shape)
        # print (Local_Wh_A_3.shape)

        # 4) Find Local_A  N x r   : Nxr * rxr by [1)dewhite N x r] * [3) local_A r x r]
        # 1 site
        LocalA_1 = dot(L_dWh_1, Local_Wh_A_1)

        # # 3 sites
        # LocalA_2 = dot(L_dWh_2, Local_Wh_A_2)
        # LocalA_3 = dot(L_dWh_3, Local_Wh_A_3)

        # 5) Concatenate LocalA_All sN x r = np.concatenate((LocalA_1),axis = 0)
        # 1 site
        LocalA_All = (LocalA_1)

        # # 3 sites        
        # LocalA_All = np.concatenate((LocalA_1, LocalA_2, LocalA_3),axis = 0)

        # Return
        # print("Local_Reconstruction...Return====LocalA===")     
        # print("Local_Reconstruction...Finish")       
        return (LocalA_All)

    def global_reconstruction3(self, LocalA_All, Global_White, Con_White, NSUB_All, NCOM_All, verbose=False):
        """Computes Global A using Global_White and Concatenated_local_White
        *Input
        LocalA_All : LocalA_All : Local A (mixing) matrix of this Modality : sNxr
        Global_White :  Global Whitening as output of Global PCA : rxsr 
        Concatenated_local_White :  Concatenate L_Wh to be Con_White: rxsN
        NSUB_All : All subject numbers of each sites in this Modality : Array of interger numbers
        NCOM_All : All component numbers of each sites in this Modality : Array of interger numbers
        verbose: flag to print optimization updates
        *Output
        GlobalA_mixer : Global A mixing matrix or Loading parameter matrix : srxr
        """

        # print("Global_Reconstruction...Start")      
        # Initialization
        # print("Global_Reconstruction...Initialization")    
        # print("Global_Reconstruction...NSUB_All =", NSUB_All) 
        # 1 site
        L_Wh_1 = Con_White[:,:int(NSUB_All[0])]
        # # 3 sites
        # L_Wh_2 = Con_White[:, int(NSUB_All[0]):(int(NSUB_All[0])+int(NSUB_All[1]))]
        # L_Wh_3 = Con_White[:, (int(NSUB_All[0])+int(NSUB_All[1])):]

        # print ("L_Wh_1 =", L_Wh_1.shape)
        # print ("L_Wh_2 =", L_Wh_2.shape)
        # print ("L_Wh_3 =", L_Wh_3.shape)

        # 1 site
        LocalA_1 = LocalA_All[:int(NSUB_All[0]) ,: ]
        # # 3 sites
        # LocalA_2 = LocalA_All[ int(NSUB_All[0]):(int(NSUB_All[0])+int(NSUB_All[1])) ,:]
        # LocalA_3 = LocalA_All[ (int(NSUB_All[0])+int(NSUB_All[1])): ,: ]

        # print ("LocalA_1 =", LocalA_1.shape)
        # print ("LocalA_2 =", LocalA_2.shape)
        # print ("LocalA_3 =", LocalA_3.shape)

        # 1 site
        Global_Wh_A_1 = Global_White[:, :int(NCOM_All[0])]
        # # 3 sites
        # Global_Wh_A_2 = Global_White[:, int(NCOM_All[0]):(int(NCOM_All[0])+int(NCOM_All[1]))]
        # Global_Wh_A_3 = Global_White[:, (int(NCOM_All[0])+int(NCOM_All[1])):]

        # print ("Global_Wh_A_1 =", Global_Wh_A_1.shape)
        # print ("Global_Wh_A_2 =", Global_Wh_A_2.shape)
        # print ("Global_Wh_A_3 =", Global_Wh_A_3.shape)

        #if verbose:
        # Compute Global A
        # print("Global_Reconstruction...Compute Local Whitening A")   
        # 1 site
        Local_Wh_A_1 = dot(L_Wh_1, LocalA_1)
        # # 3 sites
        # Local_Wh_A_2 = dot(L_Wh_2, LocalA_2)
        # Local_Wh_A_3 = dot(L_Wh_3, LocalA_3)
        
        # 1 site
        Local_Wh_A_All = Local_Wh_A_1
        # # 3 sites
        # Local_Wh_A_All = np.concatenate((Local_Wh_A_1, Local_Wh_A_2, Local_Wh_A_3),axis = 0)

        # print ("Local_Wh_A_All =", Local_Wh_A_All.shape)

        # print("Global_Reconstruction...Compute Global Whitening A")    
        # 1 site
        GlobalA_mixer_1 = dot(Global_Wh_A_1, Local_Wh_A_1)
        # # 3 sites
        # GlobalA_mixer_2 = dot(Global_Wh_A_2, Local_Wh_A_2)
        # GlobalA_mixer_3 = dot(Global_Wh_A_3, Local_Wh_A_3)

        # 1 site
        GlobalA_mixer = GlobalA_mixer_1
        # # 3 sites
        # GlobalA_mixer = np.concatenate((GlobalA_mixer_1, GlobalA_mixer_2, GlobalA_mixer_3),axis = 0)

        # print("Global_Reconstruction...Compute Global Whitening A")    
        GlobalA_mixer = dot(Global_White, Local_Wh_A_All)

        # Return
        # print("Global_Reconstruction...Return====GlobalA_mixer===")     
        # print("Global_Reconstruction...Finish")       
        return (GlobalA_mixer)

    def  findsteplength1(self, fk, deltafk, x1, x2, alphak, P, c1, c2):
        # 0<c1<0.5<c2<1;
        # (f(x+ap)-f(x))/c1/dela_f(x)/P <a

        # Initialization    
        con = 1
        coml = len(x1)

        while (con and (con < 100)) :
            xnew = x1 + alphak * P
            fk1 = np.corrcoef(xnew, x2)        
            
            fk1 = - fk1[ 0, 1] ** 2
            tcov = ((xnew - np.mean(xnew)) * (x2 - np.mean(x2)).T)/(coml-1)
            comterm = 2*(tcov)/np.var(xnew)/np.var(x2)
            deltafk1 = -comterm*(x2-np.mean(x2) + tcov*(np.mean(xnew)-xnew)/np.var(xnew))    # 1st order derivative

            firstterm1 = (fk1-fk) / c1
            # firstterm2 = deltafk * P[:]
            firstterm2 = np.dot(deltafk , P[:] )   
            # secondterm1 = deltafk1 * P[:]
            secondterm1 = np.dot(deltafk1 , P[:])
            # secondterm2 = deltafk * P[:]
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
            
                
            elif (secondterm1 < 0 and secondterm1 < c2*secondterm2):
                # alphak=abs(secondterm1/secondterm2/c2)*alphak;
                con = con + 1
                alphak = 1.1*alphak
            elif (secondterm1 > 0 and secondterm2 < 0):
                alphak = 0.9*alphak
                con = con + 1
            else:
                con = 0

            # End of if 
        # End of While

        if (con >= 50 ):
            alphak = 0
            print("Clearning rate searching for fMRI data failed!")

        return alphak

    def test_dpICA_infomax_clean(self):
        # test_dpICA_infomax_clean start
        # print('[LOG][def_stest_dpICA_infomax_clean]+++++Start++++++')    
        start = time.time()
     
        #
        # Local PCA start
        #
        print('[LOG][Flow_2_Local_PCA]=====Start=====')



        # print('[LOG][Flow_2_Local_PCA]=====Local PCA of Modality_X1=====')
        U_X1, L_white_X1, L_dewhite_X1 = self.pca_whiten2(self.clean_data_X1, self.NCOM_X1) #Do remove mean
        # U_X2, L_white_X2, L_dewhite_X2 = self.pca_whiten2(self.clean_data_X2, self.NCOM_X2) #Do remove mean
        # U_X3, L_white_X3, L_dewhite_X3 = self.pca_whiten2(self.clean_data_X3, self.NCOM_X3) #Do remove mean


        np.savetxt( DATA_PATH_OUTPUT  + "U_X1.csv", U_X1, delimiter=",")
        np.savetxt( DATA_PATH_OUTPUT + "L_white_X1.csv", L_white_X1, delimiter=",")
        np.savetxt( DATA_PATH_OUTPUT + "L_dewhite_X1.csv", L_dewhite_X1, delimiter=",")



        # print('[LOG][Flow_2_Local_PCA]=====Local PCA of Modality_Y1=====')
        U_Y1, L_white_Y1, L_dewhite_Y1 = self.pca_whiten3(self.clean_data_Y1, self.NCOM_Y1) #Don't remove mean
        # U_Y2, L_white_Y2, L_dewhite_Y2 = self.pca_whiten3(self.clean_data_Y2, self.NCOM_Y2) #Don't remove mean
        # U_Y3, L_white_Y3, L_dewhite_Y3 = self.pca_whiten3(self.clean_data_Y3, self.NCOM_Y3) #Don't remove mean


        np.savetxt( DATA_PATH_OUTPUT  + "U_Y1.csv", U_Y1, delimiter=",")
        np.savetxt( DATA_PATH_OUTPUT + "L_white_Y1.csv", L_white_Y1, delimiter=",")
        np.savetxt( DATA_PATH_OUTPUT + "L_dewhite_Y1.csv", L_dewhite_Y1, delimiter=",")

        # Print all Modality Local PCA shape
        # print('[LOG][Flow_2_Local_PCA]=====Print all Modality Local PCA shape=====')  
        print('Modality_X1 === U_X1.shape (r_X1 x d_X1)',U_X1.shape , \
            'L_white_X1 (r_X1 x N_X1) = ', L_white_X1.shape  , \
            'L_dewhite_X1 (N_X1 x r_X1 ) = ', L_dewhite_X1.shape  )  
        # print('Modality_X2 === U_X2.shape (r_X2 x d_X2)',U_X2.shape , \
        #     'L_white_X2 (r_X2 x N_X2) = ', L_white_X2.shape  , \
        #     'L_dewhite_X2 (N_X2 x r_X2 ) = ', L_dewhite_X2.shape  )  
        # print('Modality_X3 === U_X3.shape (r_X3 x d_X3)',U_X3.shape , \
        #     'L_white_X3 (r_X3 x N_X3) = ', L_white_X3.shape  , \
        #     'L_dewhite_X3 (N_X3 x r_X3 ) = ', L_dewhite_X3.shape  )              

        print('Modality_Y1 === U_Y1.shape (r_Y1 x d_Y1)',U_Y1.shape , \
            'L_white_Y1 (r_Y1 x N_Y1) = ', L_white_Y1.shape  , \
            'L_dewhite_Y1 (N_Y1 x r_Y1 ) = ', L_dewhite_Y1.shape  )  
        # print('Modality_Y2 === U_Y2.shape (r_Y2 x d_Y2)',U_Y2.shape , \
        #     'L_white_Y2 (r_Y2 x N_Y2) = ', L_white_Y2.shape  , \
        #     'L_dewhite_Y2 (N_Y2 x r_Y2 ) = ', L_dewhite_Y2.shape  )  
        # print('Modality_Y3 === U_Y3.shape (r_Y3 x d_Y3)',U_Y3.shape , \
        #     'L_white_Y3 (r_Y3 x N_Y3) = ', L_white_Y3.shape  , \
        #     'L_dewhite_Y3 (N_Y3 x r_Y3 ) = ', L_dewhite_Y3.shape  )                 

        print('[LOG][Flow_2_Local_PCA]=====End=====')          


        #
        # Global Global_U, White, and deWhite start
        #
        print('[LOG][Flow_3_Global_U, White, and deWhite]=====Start=====')    

        # Concatenate local U to Global U : sr x d         
        Global_U_mX = (U_X1)
        Global_U_mY = (U_Y1)
        # 1 site
        Global_U_X = U_X1
        Global_U_Y = U_Y1

        # 3 sites
        # Global_U_X = np.concatenate((U_X1, U_X2, U_X3),axis = 0)
        # Global_U_Y = np.concatenate((U_Y1, U_Y2, U_Y3),axis = 0)
        # Print shape of concatenated local U = Global U : sr x d 
        # print('[LOG][Flow_3_Global_U, White, and deWhite]=====Print shape of concatenated local U = Global U : sr x d =====')   
        print('Modality_X === Global_U_X.shape (sr x d) ',Global_U_X.shape )
        print('Modality_Y === Global_U_Y.shape (sr x d) ',Global_U_Y.shape )


        # Concatenate local white to Concatenated Local White Con_White : r x sN 
        # print('[LOG][Flow_3_Global_U, White, and deWhite]=====Concatenate local white to Con_White=====')   
        self.Con_White_mX = (L_white_X1)
        self.Con_White_mY = (L_white_Y1)
        # 1 site
        self.Con_White_X = L_white_X1
        self.Con_White_Y = L_white_Y1
        
        # 3 sites
        # self.Con_White_X = np.concatenate((L_white_X1, L_white_X2, L_white_X3),axis = 1)
        # self.Con_White_Y = np.concatenate((L_white_Y1, L_white_Y2, L_white_Y3),axis = 1)
        # Print shape of concatenated local white  = Con_White : r x sN 
        # print('[LOG][Flow_3_Global_U, White, and deWhite]=====Print shape of concatenated local white = Con_White : r x sN =====')   
        print('Modality_X === Con_White_X.shape (r x sN) ',self.Con_White_X.shape )
        print('Modality_Y === Con_White_Y.shape (r x sN) ',self.Con_White_Y.shape )



        # Concatenate local dewhite to Concatenated Local White Con_deWhite : sN x r
        # print('[LOG][Flow_3_Global_U, White, and deWhite]=====Concatenate local dewhite to Con_deWhite=====')   
        self.Con_deWhite_mX = (L_dewhite_X1)
        self.Con_deWhite_mY = (L_dewhite_Y1)
        # 1 site
        self.Con_deWhite_X = L_dewhite_X1
        self.Con_deWhite_Y = L_dewhite_Y1       
        # 3 sites
        # self.Con_deWhite_X = np.concatenate((L_dewhite_X1, L_dewhite_X2, L_dewhite_X3),axis = 0)
        # self.Con_deWhite_Y = np.concatenate((L_dewhite_Y1, L_dewhite_Y2, L_dewhite_Y3),axis = 0)
        # Print shape of concatenated local dewhite  = Con_deWhite : sN x r
        # print('[LOG][Flow_3_Global_U, White, and deWhite]=====Print shape of concatenated local dewhite = Con_deWhite : sN x r =====')   
        print('Modality_X === Con_deWhite_X.shape (sN x r) ',self.Con_deWhite_X.shape )
        print('Modality_Y === Con_deWhite_Y.shape (sN x r) ',self.Con_deWhite_Y.shape )

        self.NSUB_All_mX = np.zeros(0)
        self.NSUB_All_mX = np.append(self.NSUB_All_mX, int(self.NSUB_X1))
        self.NSUB_All_X = np.zeros(0)
        self.NSUB_All_X = np.append(self.NSUB_All_X, int(self.NSUB_X1))
        # self.NSUB_All_X = np.append(self.NSUB_All_X, int(self.NSUB_X2))
        # self.NSUB_All_X = np.append(self.NSUB_All_X, int(self.NSUB_X3))


        self.NSUB_All_mY = np.zeros(0)
        self.NSUB_All_mY = np.append(self.NSUB_All_mY, int(self.NSUB_Y1))
        self.NSUB_All_Y = np.zeros(0)
        self.NSUB_All_Y = np.append(self.NSUB_All_Y, int(self.NSUB_Y1))
        # self.NSUB_All_Y = np.append(self.NSUB_All_Y, int(self.NSUB_Y2))
        # self.NSUB_All_Y = np.append(self.NSUB_All_Y, int(self.NSUB_Y3))


        self.NCOM_All_mX = np.zeros(0)
        self.NCOM_All_mX = np.append(self.NCOM_All_mX, int(self.NCOM_X1))
        self.NCOM_All_X = np.zeros(0)
        self.NCOM_All_X = np.append(self.NCOM_All_X, int(self.NCOM_X1))
        # self.NCOM_All_X = np.append(self.NCOM_All_X, int(self.NCOM_X2))
        # self.NCOM_All_X = np.append(self.NCOM_All_X, int(self.NCOM_X3))


        self.NCOM_All_mY = np.zeros(0)
        self.NCOM_All_mY = np.append(self.NCOM_All_mY, int(self.NCOM_Y1))
        self.NCOM_All_Y = np.zeros(0)
        self.NCOM_All_Y = np.append(self.NCOM_All_Y, int(self.NCOM_Y1))
        # self.NCOM_All_Y = np.append(self.NCOM_All_Y, int(self.NCOM_Y2))
        # self.NCOM_All_Y = np.append(self.NCOM_All_Y, int(self.NCOM_Y3))

        print("NSUB_All_X =", self.NSUB_All_X) 
        print("NSUB_All_Y =", self.NSUB_All_Y) 
        print("NCOM_All_X =", self.NCOM_All_X) 
        print("NCOM_All_Y =", self.NCOM_All_Y) 

        print('[LOG][Flow_3_Global_U, White, and deWhite]=====Stop=====')      

        #
        # Global PCA start
        #
        print('[LOG][Flow_4_Global_PCA]=====Start=====')   

        # Global PCA of reach Modality         
        print('[LOG][Flow_4_Global_PCA]=====Global PCA of Modality_X and Modality_Y=====')



        # Experiment adding noise
        # print('Modality_Y1 Set up Start')           
        # self.S_Y1 = np.random.logistic(0, 1, (self.NCOM_Y1, self.NVOX_Y1))
        # self.A_Y1 = np.random.normal(0, 1, (self.NSUB_Y1, self.NCOM_Y1))
        # self.clean_data_Y1 = np.dot(self.A_Y1, self.S_Y1)
        # self.clean_data_Y1 = self.clean_data_Y1 - \
        #     self.clean_data_Y1.mean(axis=1).reshape((-1, 1))
        # # Modality_Y1 noisy_data
        # Global_U_X = Global_U_X + \
        #     np.random.normal(0, 1, Global_U_X.shape)
        # self.Global_U_Y = self.noisy_data_Y1 - \
        #     self.noisy_data_Y1.mean(axis=1).reshape((-1, 1))


        self.GlobalPCA_U_X, self.GlobalPCA_White_X, self.GlobalPCA_dewhite_X = self.pca_whiten3(Global_U_X, self.NCOM_X)    #Don't remove mean ==> pca.v3 and pca.v4 with round
        self.GlobalPCA_U_Y, self.GlobalPCA_White_Y, self.GlobalPCA_dewhite_Y = self.pca_whiten3(Global_U_Y, self.NCOM_Y)    #Don't remove mean ==> pca.v4 

        # print('==GlobalPCA_U_X===')   
        plt.imshow(self.GlobalPCA_U_X)
        plt.colorbar
        plt.savefig(DATA_PATH_OUTPUT  + "GlobalPCA_U_X.jpeg")
        np.savetxt( DATA_PATH_OUTPUT  + "GlobalPCA_U_X.csv", self.GlobalPCA_U_X, delimiter=",")

        # print('==GlobalPCA_U_Y===')   
        plt.imshow(self.GlobalPCA_U_Y)
        plt.colorbar
        plt.savefig(DATA_PATH_OUTPUT  + "GlobalPCA_U_Y.jpeg")
        np.savetxt( DATA_PATH_OUTPUT  + "GlobalPCA_U_Y.csv", self.GlobalPCA_U_Y, delimiter=",")

        # print('==GlobalPCA_White_X===')   
        plt.imshow(self.GlobalPCA_White_X)
        plt.colorbar
        plt.savefig(DATA_PATH_OUTPUT  + "GlobalPCA_White_X.jpeg")
        np.savetxt( DATA_PATH_OUTPUT  + "GlobalPCA_White_X.csv", self.GlobalPCA_White_X, delimiter=",")        

        # print('==GlobalPCA_White_Y===')   
        plt.imshow(self.GlobalPCA_White_Y)
        plt.colorbar
        plt.savefig(DATA_PATH_OUTPUT  + "GlobalPCA_White_Y.jpeg")
        np.savetxt( DATA_PATH_OUTPUT  + "GlobalPCA_White_Y.csv", self.GlobalPCA_White_Y, delimiter=",")

        # print('===GlobalPCA_dewhite_X==')   
        plt.imshow(self.GlobalPCA_dewhite_X)
        plt.colorbar
        plt.savefig(DATA_PATH_OUTPUT  + "GlobalPCA_dewhite_X.jpeg")
        np.savetxt( DATA_PATH_OUTPUT  + "GlobalPCA_dewhite_X.csv", self.GlobalPCA_dewhite_X, delimiter=",")    

        # print('===GlobalPCA_dewhite_Y==')   
        plt.imshow(self.GlobalPCA_dewhite_Y)
        plt.colorbar
        plt.savefig(DATA_PATH_OUTPUT  + "GlobalPCA_dewhite_Y.jpeg")
        np.savetxt( DATA_PATH_OUTPUT  + "GlobalPCA_dewhite_Y.csv", self.GlobalPCA_dewhite_Y, delimiter=",")    


        # Print all Modality Global PCA shape
        # print('[LOG][Flow_4_Global_PCA]=====Print all Modality Global PCA shape=====')
        print('Modality_X === GlobalPCA_U_X.shape (r_X x d_X)', self.GlobalPCA_U_X.shape , \
            'GlobalPCA_White_X (r_X x sr_X) = ', self.GlobalPCA_White_X.shape  , \
            'GlobalPCA_dewhite_X (sr_X x r_X ) = ', self.GlobalPCA_dewhite_X.shape  )  
        print('Modality_Y === GlobalPCA_U_Y.shape (r_Y x d_Y)',self.GlobalPCA_U_Y.shape , \
            'GlobalPCA_White_Y (r_Y x sr_Y) = ', self.GlobalPCA_White_Y.shape  , \
            'GlobalPCA_dewhite_Y (sr_Y x r_Y ) = ', self.GlobalPCA_dewhite_Y.shape  )  
        print('[LOG][Flow_4_Global_PCA]=====End=====')   


        print('[LOG][Flow_4_Global_PCA]=====End=====') 


        ###########################################################################
        # ICA Infomax flow
        #   - Flow 5
        #   - Flow 6
        #   - Flow 7
        #   - Flow 8
        #   - Flow 8a
        #

        if ICA_RUN_NUMBER == 1 :      
            self.run = 1            
            self, GlobalA_mixer_X, S_sources_X, GlobalW_unmixer_X, \
                GlobalA_mixer_Y, S_sources_Y, GlobalW_unmixer_Y = pica_infomax3(self) 
        elif ICA_RUN_NUMBER == 5 :

            b_infomax_creation = True
            # b_infomax_creation = False
            if b_infomax_creation :
                self.run = 1
                self, GlobalA_mixer_X_1, S_sources_X_1, GlobalW_unmixer_X_1, GlobalA_mixer_Y_1, S_sources_Y_1, GlobalW_unmixer_Y_1 = pica_infomax3(self) 
                self.run = 2
                self, GlobalA_mixer_X_2, S_sources_X_2, GlobalW_unmixer_X_2, GlobalA_mixer_Y_2, S_sources_Y_2, GlobalW_unmixer_Y_2 = pica_infomax3(self) 
                self.run = 3
                self, GlobalA_mixer_X_3, S_sources_X_3, GlobalW_unmixer_X_3, GlobalA_mixer_Y_3, S_sources_Y_3, GlobalW_unmixer_Y_3 = pica_infomax3(self) 
                self.run = 4
                self, GlobalA_mixer_X_4, S_sources_X_4, GlobalW_unmixer_X_4, GlobalA_mixer_Y_4, S_sources_Y_4, GlobalW_unmixer_Y_4 = pica_infomax3(self) 
                self.run = 5
                self, GlobalA_mixer_X_5, S_sources_X_5, GlobalW_unmixer_X_5, GlobalA_mixer_Y_5, S_sources_Y_5, GlobalW_unmixer_Y_5 = pica_infomax3(self) 


            if ICA_RUN_AVERAGE :
                print('[LOG][Flow_8b_Parallel_ICA-Global] Multi-run ICA AVERAGE of ', str(self.run), " X run. Start.") 
                self, GlobalA_mixer_X, S_sources_X, GlobalW_unmixer_X \
                    = pica_infomax_run_average2(self, "X", ICA_RUN_NUMBER, self.GlobalPCA_U_X , \
                                                                        GlobalW_unmixer_X_1 , \
                                                                        GlobalW_unmixer_X_2 , \
                                                                        GlobalW_unmixer_X_3 , \
                                                                        GlobalW_unmixer_X_4 , \
                                                                        GlobalW_unmixer_X_5 ) 
                print('[LOG][Flow_8b_Parallel_ICA-Global] Multi-run ICA AVERAGE of ', str(self.run), " X run. Finish.") 

                print('[LOG][Flow_8b_Parallel_ICA-Global] Multi-run ICA AVERAGE of ', str(self.run), " Y run. Start.") 
                self, GlobalA_mixer_Y, S_sources_Y, GlobalW_unmixer_Y \
                    = pica_infomax_run_average2(self, "Y", ICA_RUN_NUMBER, self.GlobalPCA_U_Y , \
                                                                        GlobalW_unmixer_Y_1 , \
                                                                        GlobalW_unmixer_Y_2 , \
                                                                        GlobalW_unmixer_Y_3 , \
                                                                        GlobalW_unmixer_Y_4 , \
                                                                        GlobalW_unmixer_Y_5 ) 
                print('[LOG][Flow_8b_Parallel_ICA-Global] Multi-run ICA AVERAGE of ', str(self.run), " Y run. Finish.") 

            if ICA_RUN_ICASSO :
                print('[LOG][Flow_8b_Parallel_ICA-Global] Multi-run ICA ICASSO of ', str(self.run), " X run. Start.")               
                self, GlobalA_mixer_X, S_sources_X, GlobalW_unmixer_X \
                    = pica_infomax_run_icasso3(self, "X", ICA_RUN_NUMBER, self.GlobalPCA_U_X , \
                                                                        GlobalW_unmixer_X_1 , \
                                                                        GlobalW_unmixer_X_2 , \
                                                                        GlobalW_unmixer_X_3 , \
                                                                        GlobalW_unmixer_X_4 , \
                                                                        GlobalW_unmixer_X_5 ) 
                print('[LOG][Flow_8b_Parallel_ICA-Global] Multi-run ICA ICASSO of ', str(self.run), " X run. Finish.")  

                print('[LOG][Flow_8b_Parallel_ICA-Global] Multi-run ICA ICASSO of ', str(self.run), " Y run. Start.")   
                self, GlobalA_mixer_Y, S_sources_Y, GlobalW_unmixer_Y \
                    = pica_infomax_run_icasso3(self, "Y", ICA_RUN_NUMBER, self.GlobalPCA_U_Y , \
                                                                        GlobalW_unmixer_Y_1 , \
                                                                        GlobalW_unmixer_Y_2 , \
                                                                        GlobalW_unmixer_Y_3 , \
                                                                        GlobalW_unmixer_Y_4 , \
                                                                        GlobalW_unmixer_Y_5 ) 
                print('[LOG][Flow_8b_Parallel_ICA-Global] Multi-run ICA ICASSO of ', str(self.run), " Y run. Finish.") 

        ##########################################################################

        print('[LOG][Flow_9_Looping the next iteration of Global ICA (Finding W) via Infomax and pICA (Finding ∆A)]. Finish.')   


        ###########################################################################
        # Report Analysis    
        # self.ica_infomax2()
        print('[LOG][Flow_10_Report]=====Print all Modality shape=====')
        print('Modality_X === GlobalA_mixer_X.shape (r_X x r_X) = ',GlobalA_mixer_X.shape , \
            'S_sources_X (r_X x d_X) = ', S_sources_X.shape  , \
            'GlobalW_unmixer_X (r_X x r_X ) = ', GlobalW_unmixer_X.shape  )  
        print('Modality_Y === GlobalA_mixer_Y.shape (r_Y x r_Y) = ',GlobalA_mixer_Y.shape , \
            'S_sources_Y (r_Y x d_Y) = ', S_sources_Y.shape  , \
            'GlobalW_unmixer_Y (r_Y x r_Y ) = ', GlobalW_unmixer_Y.shape  )  

        # Report correlation data - Local reconstruction

        print('[LOG][Flow_10_Report_correlation_data-Local_reconstruction]=====Start=====')   

        # Report_correlation_data- Find local A using GlobalPCA_dewhite_X and Con_deWhite_X    
        # Called Local-reconstruction ; from-Global-to-Local     
        print('[LOG][Flow_10_Report_correlation_data-Local_reconstruction]=====Modality_X : Find local A using GlobalPCA_dewhite_X and Con_deWhite_X   =====')
        LocalA_Corr_All_X = self.local_reconstruction4(GlobalA_mixer_X, \
            self.GlobalPCA_dewhite_X, self.Con_deWhite_X, self.NSUB_All_X, self.NCOM_All_X)   
        print('[LOG][Flow_10_Report_correlation_data-Local_reconstruction]=====Modality_Y : Find local A using GlobalPCA_dewhite_Y and Con_deWhite_Y   =====')            
        LocalA_Corr_All_Y = self.local_reconstruction4(GlobalA_mixer_Y, \
            self.GlobalPCA_dewhite_Y, self.Con_deWhite_Y, self.NSUB_All_Y, self.NCOM_All_Y)               
        # Print all Modality local A shape
        print('[LOG][Flow_10_Report_correlation_data-Local_reconstruction]=====Print all Modality local A shape=====')
        print('Modality_X === LocalA_mixer_All_X (sN_X x r_X)',LocalA_Corr_All_X.shape )
        print('Modality_Y === LocalA_mixer_All_Y (sN_Y x r_Y)',LocalA_Corr_All_Y.shape )

        print('[LOG][Flow_10_Report_correlation_data-Local_reconstruction]=====Finish=====')  


    
        print('[LOG][Flow_10_Report_correlation_between_Python_and_MathLab]=====LocalA_Start=====')    
         
        LocalA_Corr_A1_X = LocalA_Corr_All_X[:int(self.NSUB_All_X[0]), :]
        LocalA_Corr_A1_Y = LocalA_Corr_All_Y[:int(self.NSUB_All_Y[0]), :]

        # Save S_X, S_Y, local_A_X, and local_A_Y

        np.savetxt( DATA_PATH_OUTPUT + "LocalA_Corr_A1_X.csv", LocalA_Corr_A1_X, delimiter=",")
        np.savetxt( DATA_PATH_OUTPUT + "LocalA_Corr_A1_Y.csv", LocalA_Corr_A1_Y, delimiter=",")
        np.savetxt( DATA_PATH_OUTPUT + "GlobalA_mixer_X.csv", GlobalA_mixer_X, delimiter=",")
        np.savetxt( DATA_PATH_OUTPUT + "S_sources_X.csv", S_sources_X, delimiter=",")
        np.savetxt( DATA_PATH_OUTPUT + "GlobalW_unmixer_X.csv", GlobalW_unmixer_X, delimiter=",")
        np.savetxt( DATA_PATH_OUTPUT + "GlobalA_mixer_Y.csv", GlobalA_mixer_Y, delimiter=",")
        np.savetxt( DATA_PATH_OUTPUT + "S_sources_Y.csv", S_sources_Y, delimiter=",")
        np.savetxt( DATA_PATH_OUTPUT + "GlobalW_unmixer_Y.csv", GlobalW_unmixer_Y, delimiter=",")

        return (self)

def ica_fuse_falsemaxdetect(self, data, trendPara = 0.0 , LtrendPara = 0.0):
        # function [Overindex ] = ica_fuse_falsemaxdetect(data, trendPara,LtrendPara)
        # % false maximun detect fucntion is to detect if a flase maximum occurs
        # % by checking entroy's trend along time.
        # % if there is  a decreaseing trend , then the false maximum occur;
        # % if osciilation for a long time without increasing occurs, Then the false
        # % maximum occur; 

        if trendPara == 0.0 :
            LtrendPara= 1e-4
            trendPara= -1e-3 #% the parameter -1e-3 or -5e-4, or -1e-4; need to test on simulation for overfitting problem with  low correlation
        elif LtrendPara == 0.0 :
            LtrendPara= -1e-4
        # end if

        if not (LtrendPara) :
            LtrendPara = 0.0001 
        if not  (trendPara) :
                trendPara= -0.001
        
        Overindex = 0

        # % if osciilation for a long time without increasing occurs, Then the false maximum occur; 
        n =   len(data)

        if  n > 60 :
            datat = data[n-49:n] - np.mean(data[n-49:n])
            p = np.polyfit(data[1:50],datat,1)
            if abs(p[1]) < LtrendPara :
                Overindex = 1
            # end if
        # end if
         
        if not Overindex : 
            datat = data[n-4:n] - np.mean(data[n-4:n])
            p = np.polyfit(data[1:5],datat,1)
            r = datat - np.polyval(p,data[1:5])
            if p[1] < trendPara :
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
        print('X and Y must have the same number of rows.')
    #end

    [nx1, nx2] = x.shape    # 43 x 8

    # Initialise pairwise correlation
    c = np.zeros((nx2, ny2))    # 8 x 8

    # Loop over rows
    # for ii in range(1,nx2):     # nx2=8
    #     for jj in range(1,ny2):     # ny2 = 8
    for ii in range(0,nx2):     # nx2=8
        for jj in range(0,ny2):     # ny2 = 8
            x_ii = x[:, ii]
            y_jj = y[:, jj]
            c[ii, jj] = ica_fuse_corr2(self, x[:, ii], y[:, jj]) # Find corr each colume
    # End loop over rows

    return c

def ica_fuse_corr2(self, x, y): # x 43x1   y = 43x1
    # computes correlation coefficient
    meanX = np.mean(x)      # -2.0273
    meanY = np.mean(y)      # -0.0429

    # Remove mean
    x = x - meanX       # 43x1
    y = y - meanY       # 43x1

    # corr_coeff = sum(sum(x.*y))/sqrt(sum(sum(x.*x))*sum(sum(y.*y)))
    corr_coeff = np.sum(np.sum(x*y, axis=0)) / math.sqrt(np.sum(np.sum(x*x)) * np.sum(np.sum(y*y)))

    return corr_coeff   # 0.104126716980983

def weight_update3(self, weights, x_white, bias1, lrate1):
    """ Update rule for infomax
    This function recieves parameters to update W1
    * Input
    W1: unmixing matrix (must be a square matrix)
    Xwhite1: whitened data
    bias1: current estimated bias
    lrate1: current learning rate
    startW1: in case update blows up it will start again from startW1
    * Output
    W1: updated mixing matrix
    bias: updated bias
    lrate1: updated learning rate
    """
    NCOMP, NVOX = x_white.shape
    block1 = int(np.floor(np.sqrt(NVOX / 3)))
    permute1 = permutation(NVOX)
    for start in range(0, NVOX, block1):
        if start + block1 < NVOX:
            tt2 = start + block1
        else:
            tt2 = NVOX
            block1 = NVOX - start

        unmixed = dot(weights, x_white[:, permute1[start:tt2]]) + bias1
        logit = 1 - (2 / (1 + np.exp(-unmixed)))
        weights = weights + lrate1 * dot(
            block1 * np.eye(NCOMP) + dot(logit, unmixed.T), weights)
        bias1 = bias1 + lrate1 * logit.sum(axis=1).reshape(bias1.shape)
        # Checking if W blows up
        if (np.isnan(weights)).any() or np.max(np.abs(weights)) > MAX_W:
            # print("Numeric error! restarting with lower learning rate")
            print("Weight is outside the range. Restarting.")            
            lrate1 = lrate1 * ANNEAL
            weights = np.eye(NCOMP)
            bias1 = np.zeros((NCOMP, 1))
            error = 1

            if lrate1 > 1e-6 and \
            matrix_rank(x_white) < NCOMP:
                print("Data 1 is rank defficient"
                    ". I cannot compute " +
                    str(NCOMP) + " components.")
                return (None, None, None, 1)

            if lrate1 < 1e-6:
                print("Weight matrix may"
                    " not be invertible...")
                return (None, None, None, 1)
            break
        else:
            error = 0

    return (weights, bias1, lrate1, error)

def pica_infomax3(self):    
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
    # print("INFOMAX...Start")      


    # Initialization
    self.maxsteps = DEFAULT_MAXSTEPS

    data1 = self.GlobalPCA_U_X
    STEP_X = 0
    STOPSIGN_X = 0
    self.NCOM_X = self.GlobalPCA_U_X.shape[0]
    self.old_weight_X = np.eye(self.NCOM_X)
    bias_X = np.zeros((self.NCOM_X, 1))
    sphere_X = []
    weight_X = []
    self.d_weight_X = np.zeros(self.NCOM_X)
    self.old_d_weight_X = np.zeros(self.NCOM_X)
    self.clear_X = self.GlobalPCA_U_X
    chans_X, frames_X = self.GlobalPCA_U_X.shape #% determine the data size
    urchans_X = chans_X    #% remember original data channels
    datalength_X = frames_X
    DEFAULT_BLOCK_X = int(np.floor(np.sqrt(frames_X/3)))
    DEFAULT_LRATE_X = 0.015/np.log(chans_X)
    # Experiment
    DEFAULT_LRATE_X = 0.000014      #Shortcut Learning rate for ABCD fMRI
    delta_X = []
    wts_blowup_X = 0


    data2 = self.GlobalPCA_U_Y
    STEP_Y = 0
    STOPSIGN_Y = 0        
    self.NCOM_Y = self.GlobalPCA_U_Y.shape[0]
    self.old_weight_Y = np.eye(self.NCOM_Y)
    bias_Y = np.zeros((self.NCOM_Y, 1))
    sphere_Y = []
    weight_Y = []
    self.d_weight_Y = np.zeros(self.NCOM_Y)
    self.old_d_weight_Y = np.zeros(self.NCOM_Y)
    self.clear_Y = self.GlobalPCA_U_Y
    chans_Y, frames_Y = self.GlobalPCA_U_Y.shape #% determine the data size
    urchans_Y = chans_Y    #% remember original data channels
    datalength_Y = frames_Y
    DEFAULT_BLOCK_Y = int(np.floor(np.sqrt(frames_Y/3)))
    DEFAULT_LRATE_Y = 0.015/np.log(chans_Y)
    delta_Y = []
    wts_blowup_Y = 0


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
    ncomps = self.NCOM_X    # fprintf(..'runica(): pca value should be the number of principal components to retain')
    pcaflag = 'off'          # fprintf(..'runica(): pca value should be the number of principal components to retain')
    posactflag = ''         # fprintf('runica(): posact value must be on or off')
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
    
    # Mart experiment
    extended = 0 #1 #0            # % turn on extended-ICA
    extblocks = 1           # % number of blocks per kurt() compute
    verbose = 1             # fprintf('runica(): verbose flag value must be on or off')
    dewhiteM = 0            #
    prefs = 0
    tc = 0
    whiteM = 0
    MaxComCon = CONSTRAINED_COMPONENTS
    trendPara   = 0

    # %%%%%%%%%%%%%%%%%%%%%%%% Connect_threshold computation %%%%%%%%%%%%%%%%%%%%%%%%

    N = self.NSUB_X1
    Connect_threshold =  self.p_to_r2 (N)  # % set a threshold to select columns constrained.
    print('    ')
    print('    ')
    print('[LOG]=====INFOMAX=====')
    print('[LOG]Number of subject =  ', N )
    print('[LOG]CONSTRAINED_CONNECTION =  ', Connect_threshold)
    print('[LOG]CONSTRAINED_CONNECTION_PROABILITY =  ', CONSTRAINED_CONNECTION_PROABILITY)  # CONSTRAINED_CONNECTION_PROABILITY = 0.025

    # %%%%%%%%%%%%%%%%%%%%%%%% Initialize weights, etc. %%%%%%%%%%%%%%%%%%%%%%%%

    if not extended :
        annealstep = DEFAULT_ANNEALSTEP     # 0.90;DEFAULT_ANNEALSTEP   = 0.90
    else:    
        annealstep = DEFAULT_EXTANNEAL      # 0.98;DEFAULT_EXTANNEAL    = 0.98


    if annealdeg :
        annealdeg  = DEFAULT_ANNEALDEG - momentum*90    #; % heuristic DEFAULT_ANNEALDEG    = 60; 
        if annealdeg < 0 :
            annealdeg = 0

    if ncomps >  chans_X or ncomps < 1 :
        print ('runica(): number of components must be 1 to %d.' %chans_X)
        return

    #% initialize weights
    #if weights ~= 0,   # weights =0

    # %
    # %%%%%%%%%%%%%%%%%%%%% Check keyword values %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    # %
    if frames_X < chans_X  :
        print ('runica(): X : data length %d < data channels %f!' %(frames_X,chans_X) )
        return
    elif frames_Y < chans_Y :
        print ('runica(): X : data length %d < data channels %f!' %(frames_Y,chans_Y) )
        return

    # %
    # %%%%%%%%%%%%%%%%%%%%%%%%%%%%%% Process the data %%%%%%%%%%%%%%%%%%%%%%%%%%
    # %

    if verbose :
        print (' Input data X size [%d,%d] = %d channels, %d frames.' \
            %(chans_X, frames_X,chans_X, frames_X))
        print (' Input data Y size [%d,%d] = %d channels, %d frames.' \
            %(chans_Y, frames_Y,chans_Y, frames_Y))
        
        if pcaflag == 'on' :
            print (' After PCA dimension reduction,  finding ')
        else:
            print (' Finding ')
        
        if ~extended :
            print (' %d ICA components using logistic ICA.' %ncomps)
        else : #% if extended
            print (' %d ICA components using extended ICA.',ncomps)
            if extblocks > 0 :
                print ('Kurtosis will be calculated initially every %d blocks using %d data points.' %(extblocks,kurtsize))
            else :
                print ('Kurtosis will not be calculated. Exactly %d sub-Gaussian components assumed.'% nsub)
            # end of if extblocks > 0 :
        # end of if ~extended :

        print ('Initial X learning rate will be %g, block size %d.'%(lrate[0],block[0]))
        print ('Initial Y learning rate will be %g, block size %d.'%(lrate[1],block[1]))

        if momentum > 0: 
            print ('Momentum will be %g.\n'%momentum)

        print ('Learning rate will be multiplied by %g whenever angledelta >= %g deg.'%(annealstep,annealdeg))
        print ('Training will end when wchange < %g or after %d steps.' %(nochange,maxsteps))
        if biasflag :
            print ('Online bias adjustment will be used.')
        else:
            print ('Online bias adjustment will not be used.')
        # end of if biasflag :
    # end of  if verbose :
    # %
    # %%%%%%%%%%%%%%%%%%%%%%%%% Remove overall row means %%%%%%%%%%%%%%%%%%%%%%%%
    # %
    print ('Not removing mean of each channel!!!')

    if verbose :
        print ('Final training data1 range: %g to %g' % (np.amin(data1),np.amax(data1)))
        print ('Final training data1 range: %g to %g' % (np.amin(data2),np.amax(data2)))

    # %
    # %%%%%%%%%%%%%%%%%%% Perform PCA reduction %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    # %
    if pcaflag =='on' :
        print ('Reducing the data to %d principal dimensions...\n',ncomps)
        # % make data its projection onto the ncomps-dim principal subspace
    # end of if pcaflag =='on' :

    # %
    # %%%%%%%%%%%%%%%%%%% Perform specgram transformation %%%%%%%%%%%%%%%%%%%%%%%
    # %
    if srate > 0 :
        print ('srate > 0 ')

    # end of if srate > 0 
    # %
    # %%%%%%%%%%%%%%%%%%% Perform sphering %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    # %        


    ###########################################################################



    if sphering == 'on' :
        if verbose :
            print ('Computing the sphering matrix...')
        sphere_X_1 = np.cov(data1.T,rowvar=False )    # find the "sphering" matrix = spher()
        sphere_X_2 = (sqrtm( sphere_X_1   ))    # find the "sphering" matrix = spher()
        sphere_X_3 = inv(sphere_X_2)    # find the "sphering" matrix = spher()
        sphere_X = 2.0*sphere_X_3   # find the "sphering" matrix = spher()


        sphere_Y = 2.0*inv(sqrtm(np.cov(data2.T,rowvar=False )))    # find the "sphering" matrix = spher()
        if not weights :
            if verbose :
                print (' Starting weights are the identity matrix ...')

            weights=1
            weight_X = np.eye(self.NCOM_X, chans_X) #% begin with the identity matrix
            weight_Y = np.eye(self.NCOM_Y, chans_Y) #% begin with the identity matrix

        else  :  #% weights given on commandline
            if verbose :
                print (' Using starting weights named on commandline ...')
            
        # end of if not weights :
        if verbose :
            print (' Sphering the data ...')
                    
        data1 = np.dot(sphere_X,data1)     # % actually decorrelate the electrode signals
        data2 = np.dot(sphere_Y,data2)     # % actually decorrelate the electrode signals
    elif sphering == 'off' : # %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
        if  not weights :
            if verbose : 
                print (' Using the sphering matrix as the starting weight matrix ...')
                print (' Returning the identity matrix in variable "sphere" ...')
            
            sphere_X = 2.0*np.inv(sqrtm(np.cov(data1.T,rowvar=False))) # % find the "sphering" matrix = spher()
            weight_X = np.eye(self.NCOM_X,chans_X) * sphere_X # % begin with the identity matrix
            sphere_X = np.eye(chans_X)               #   % return the identity matrix
            sphere_Y = 2.0*np.inv(sqrtm(np.cov(data2.T,rowvar=False)))  # ; % find the "sphering" matrix = spher()
            weight_Y = np.eye(self.NCOM_Y,chans_Y) * sphere_Y # % begin with the identity matrix
            sphere_Y = np.eye(chans_Y)               #   % return the identity matrix
            
        else : # % weights ~= 0
            if verbose :
                print (' Using starting weights named on commandline ...')
                print (' Returning the identity matrix in variable "sphere" ...')
            
            sphere_X = np.eye(chans_X)             #  % return the identity matrix
            sphere_Y = np.eye(chans_Y)             #  % return the identity matrix
        # end not weights :
    elif sphering == 'none':
        sphere_X = np.eye(chans_X)             #  % return the identity matrix
        sphere_Y = np.eye(chans_Y)             #  % return the identity matrix
        if not weights  : 
            if verbose :
                print (' Starting weights are the identity matrix ...')
                print (' Returning the identity matrix in variable "sphere" ...')
            # end of if verbose :
            weight_X = np.eye(self.NCOM_X, chans_X) #% begin with the identity matrix
            weight_Y = np.eye(self.NCOM_Y, chans_Y) #% begin with the identity matrix

        else : # % weights ~= 0
            if verbose : 
                print (' Using starting weights named on commandline ...')
                print (' Returning the identity matrix in variable "sphere" ...')
            # end of if verbose :
        # end not weights :
        sphere_X = np.eye(chans_X,chans_X)              #  % return the identity matrix
        sphere_Y = np.eye(chans_Y,chans_Y)              #  % return the identity matrix            
        if verbose :
            print ('Returned variable "sphere" will be the identity matrix.')
        # end of if verbose 
    #end sphering == 'on' :

    self.GlobalPCA_U_X = data1
    self.GlobalPCA_U_Y = data2


    # %
    # %%%%%%%%%%%%%%%%%%%%%%%% Initialize ICA training %%%%%%%%%%%%%%%%%%%%%%%%%
    # %
    lastt_X = np.fix((datalength_X/block[0]-1)*block[0]+1)
    lastt_Y = np.fix((datalength_Y/block[1]-1)*block[1]+1)
    degconst = 180/np.pi

    BI_X = block[0] * np.eye(self.NCOM_X,self.NCOM_X)
    BI_Y = block[1] * np.eye(self.NCOM_Y,self.NCOM_Y) 
    delta_X = np.zeros((1,chans_X * chans_X))
    delta_Y = np.zeros((1,chans_Y * chans_Y))
    change_X = 1
    change_Y = 1
    oldchange_X = 0
    oldchange_Y = 0
    startweight_X = weight_X
    startweight_Y = weight_Y
    prevweight_X = startweight_X
    prevweight_Y = startweight_Y
    oldweight_X = startweight_X
    oldweight_Y = startweight_Y
    prevwtchange_X = np.zeros((chans_X,self.NCOM_X))
    prevwtchange_Y = np.zeros((chans_Y,self.NCOM_Y))      
    oldwtchange_X = np.zeros((chans_X,self.NCOM_X))       
    oldwtchange_Y = np.zeros((chans_Y,self.NCOM_Y))
    lrates_X = np.zeros((1,maxsteps))
    lrates_Y = np.zeros((1,maxsteps))
    onesrow_X = np.ones((1,block[0]))
    onesrow_Y = np.ones((1,block[1]))
    signs_X = np.ones((1,self.NCOM_X)) #    % initialize signs to nsub -1, rest +1
    signs_Y = np.ones((1,self.NCOM_Y)) #    % initialize signs to nsub -1, rest +1

    for k in range(1,nsub) : 
        signs_X[k] = -1
        signs_Y[k] = -1
    # end for
    
    if extended and extblocks < 0 and verbose :
        print('Fixed extended-ICA sign assignments:  ')

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
    urextblocks = extblocks #  % original value, for resets

    old_kk_X = np.zeros((1,self.NCOM_X)) #   % for kurtosis momemtum
    old_kk_Y = np.zeros((1,self.NCOM_Y)) #   % for kurtosis momemtum

    # %
    # %%%%%%%% ICA training loop using the logistic sigmoid %%%%%%%%%%%%%%%%%%%
    # %

    if verbose :
        print('Beginning ICA training ...')
        if extended :
            print(' first training step may be slow ...')
        else:
            print('\n')
        # end if
    # end if
    STEP_X = 0
    STEP_Y = 0
    blockno_X = 1
    blockno_Y = 1
    STOPSIGN_X  = 0
    STOPSIGN_Y  = 0

    alphak_X = 1
    alphak_Y = 1  # %alphak_R=[1,1];
    Crate_X = 1 
    Crate_Y = 1


    lrate_X = DEFAULT_LRATE_X  #Dataset X step 1 - lrate 0.000014
    lrate_Y = DEFAULT_LRATE_Y
    lossf_X = np.zeros(maxsteps+1)
    lossf_Y = np.zeros(maxsteps+1)

    angledelta_X = 0        
    angledelta_Y = 0        

    entropy_X = 0
    entropy_Y = 0

    entropychange_X = 0
    entropychange_Y = 0

    print("[LOG]=====INFOMAX=====maxsteps=", maxsteps)

    # while ((STEP_X < maxsteps or STEP_Y < maxsteps) and \
    #     (not STOPSIGN_X and not STOPSIGN_X) ):
    # %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
    while (STEP_X < maxsteps or STEP_Y < maxsteps) :


        if not STOPSIGN_X :
            # Global ICA - Find Global A (aka find Global W) using Infomax         
            # print('[LOG][Flow_5_Global_ICA]=====Modality_X : Find Global A (aka find Global W) using Infomax =====')

            eps = np.finfo(np.float32).eps
            u = np.dot(weight_X , data1) + np.dot( bias_X , np.ones((1,frames_X)) )
            y = 1 / (1 + np.exp(-u)  )
            yy = (1-y)                              
            temp1 = np.dot(weight_X,y)              
            temp2 = (temp1 * yy)                    
            temp = np.log( abs( temp2 ) + eps)      

            entropy_X = np.mean(temp)       
            # ------------

            # begin to update weight matrix
            permuteVec = np.random.permutation(range(datalength_X)) #randperm(datalength_X) # % shuffle data order at each step
            (weight_X, bias_X, lrate_X, wts_blowup_X) = self.weight_update3(weight_X, data1, bias_X, lrate_X)


            if np.amax(np.amax(abs(weight_X))) > MAX_WEIGHT :
                wts_blowup_X  = 1
                change_X = nochange 
            #end if

            # %---------------------------
            # % if weight is not  blowup, update
            if not wts_blowup_X :
                
                oldwtchange_X  = weight_X - oldweight_X
                STEP_X = STEP_X + 1
                lrates_X[0,STEP_X] = lrate_X
                angledelta_X = 0 
                delta_X = oldwtchange_X.reshape(1 , chans_X* self.NCOM_X ) 
                change_X = np.dot(delta_X,delta_X.T)
                
            # end if not wts_blowup_X
            #%DATA1 blow up restart-------------------------------
            if wts_blowup_X or np.isnan(change_X) or np.isinf(change_X) : #  % if weights blow up,
                print(' ')
                STEP_X = 0
                STOPSIGN_X = 0 #                % start again
                change_X = nochange
                wts_blowup_X = 0 #                    % re-initialize variables
                blockno_X = 1
                lrate_X = lrate_X * DEFAULT_RESTART_FAC #; % with lower learning rate
                weight_X  = startweight_X  #            % and original weight matrix
                oldweight_X  = startweight_X
                oldwtchange_X = np.zeros((chans_X,self.NCOM_X))  
                delta_X = np.zeros((1,chans_X * chans_X))
                olddelta_X = delta_X
                extblocks = urextblocks
                prevweight_X  = startweight_X
                prevwtchange_X = np.zeros((chans_X,self.NCOM_X))
                lrates_X = np.zeros((1,maxsteps))
                bias_X = np.zeros((self.NCOM_X, 1))
                
                if extended : 
                    signs_X = np.ones((1,self.NCOM_X))  #% initialize signs to nsub -1, rest +1
            
                    for k in range(1,nsub) :
                        signs_X[k] = -1
                    # end for
                    signs_X = np.diag(signs_X) # % make a diagonal matrix
                    oldsigns_X = np.zeros(signs_X.size)
                # end if extended
                if lrate_X > MIN_LRATE :
                    r =  matrix_rank(data1)
                    if r < self.NCOM_X :
                        print('Data has rank %d. Cannot compute %d components.' %( r,self.NCOM_X))
                        return
                    else : 
                        print('Lowering learning rate to %g and starting again.' %lrate_X)
                    #end if
                else :
                    print('runica(): QUITTING - weight matrix may not be invertible!')
                    return
                #end if 
            else  : #% if DATA1 weights in bounds
                # %testing the trend of entropy term, avoiding the overfitting of correlation

                u = np.dot(weight_X , data1 [:, :]) + bias_X * np.ones((1,frames_X))
                y = 1/(1 + np.exp(-u))
                temp = np.log(abs( (np.dot(weight_X,y) * (1-y) ) + eps))
                lossf_X[STEP_X] = np.mean(temp) 
                
                #%changes of entropy term added by jingyu
                if STEP_X > 1 :
                    entropychange_X = lossf_X[STEP_X] - entropy_X
                else :
                    entropychange_X = 1
                #end
                #%--------
                
                if STEP_X > 5 :
                    index_X = ica_fuse_falsemaxdetect(self, lossf_X,trendPara)
                    if index_X :
                        Crate_X  = Crate_X*0.9 #         % anneal learning rate empirical
                    # end if
                #end % end of test------------------------

                # %%%%%%%%%%%%% Print weight update information %%%%%%%%%%%%%%%%%%%%%%
                # %

                if STEP_X  > 2 and not STOPSIGN_X :
                    temp_d = np.dot(delta_X , olddelta_X.T )
                    temp_s = np.sqrt(change_X * oldchange_X )
                    angledelta_X = math.acos(temp_d/ temp_s)
                #end
                if verbose :
                    if STEP_X > 2 :
                        if not extended :
                            print('Dataset X step %d - lrate %5f, wchange %7.6f, angledelta %4.1f deg' 
                                %(  STEP_X, lrate_X, change_X, degconst*angledelta_X) )
                        else :
                            print('Dataset X step %d - lrate %5f, wchange %7.6f, angledelta %4.1f deg, %d subgauss' 
                                %( STEP_X, lrate_X, change_X, degconst*angledelta_X, (self.NCOM_X - sum(np.diag(signs_X)))/2)) 
                        #end
                    elif not extended :
                        print('Dataset X step %d - lrate %5f, wchange %7.6f' %(STEP_X, lrate_X, change_X.astype(np.float)))
                    else:
                        print('Dataset X step %d - lrate %5f, wchange %7.6f, %d subgauss' 
                            %( STEP_X, lrate_X, change_X, (self.NCOM_X - sum(np.diag(signs_X)))/2))
                    #end % step > 2
        
                # %%%%%%%%%%%%%%%%%%%% Anneal learning rate %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                # %
                if entropychange_X < 0  : #%| degconst*angledelta(1) > annealdeg,
                    lrate_X = lrate_X * annealstep #          % anneal learning rate
                    olddelta_X = delta_X  #                % accumulate angledelta until
                    oldchange_X  = change_X #              %  annealdeg is reached
                elif STEP_X == 1 : #                     % on first step only
                    olddelta_X   = delta_X #                % initialize
                    oldchange_X  = change_X
                # end
                
                #%%%%%%%%%%%%%%%%%%%% Apply stopping rule %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                # Apply stopping rule               
                if STEP_X  > 2 and change_X < nochange:    # apply stopping rule
                    STOPSIGN_X  = 1                    # stop when weights stabilize
                    print ("STOPSIGN_X = True")                        
                elif STEP_X  >= maxsteps :
                    STOPSIGN_X  = 1                    # max step
                    print ("STOPSIGN_X = True")                        
                elif change_X > DEFAULT_BLOWUP :       # if weights blow up,
                    lrate_X = lrate_X * DEFAULT_BLOWUP_FAC    # keep trying with a smaller learning rate
                # end if
                # %%%%%%%%%%%%%%%%%% Save current values %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                oldweight_X  = weight_X                    
            #end; % end if weights in bounds
        # end if ~stopsign(1)


        if not STOPSIGN_Y :
            # Global ICA - Find Global A (aka find Global W) using Infomax         
            # print('[LOG][Flow_5_Global_ICA]=====Modality_Y : Find Global A (aka find Global W) using Infomax =====')

            eps = np.finfo(np.float32).eps
            u = weight_Y@data2 + bias_Y @ np.ones((1,frames_Y))
            y = 1 / (1 + np.exp (-u))
            yy = (1-y)                              
            temp1 = np.dot(weight_Y,y)              
            temp2 = (temp1 * yy)                    
            temp = np.log( abs( temp2 ) + eps)     

            entropy_Y = np.mean(temp)       
            # ------------

            # begin to update weight matrix
            permuteVec = np.random.permutation(range(datalength_Y)) #randperm(datalength_Y) # % shuffle data order at each step


            (weight_Y, bias_Y, lrate_Y, wts_blowup_Y) = self.weight_update3(weight_Y, data2, bias_Y, lrate_Y)

            if np.amax(abs(weight_Y)) > MAX_WEIGHT :                    
                wts_blowup_Y  = 1
                change_Y = nochange 
            #end


            # %---------------------------
            # % if weight is not  blowup, update
            if not wts_blowup_Y :
                
                oldwtchange_Y  = weight_Y - oldweight_Y
                STEP_Y = STEP_Y + 1
                lrates_Y[0,STEP_Y] = lrate_Y
                angledelta_Y = 0 
                delta_Y = oldwtchange_Y.reshape(1 , chans_Y* self.NCOM_Y ) 
                change_Y = np.dot(delta_Y,delta_Y.T)
                
            # end if not wts_blowup_Y
            #%DATA1 blow up restart-------------------------------
            if wts_blowup_Y or np.isnan(change_Y) or np.isinf(change_Y) : #  % if weights blow up,
                print(' ')
                STEP_Y = 0
                STOPSIGN_Y = 0 #                % start again
                change_Y = nochange
                wts_blowup_Y = 0 #                    % re-initialize variables
                blockno_Y = 1
                lrate_Y = lrate_Y * DEFAULT_RESTART_FAC #; % with lower learning rate
                weight_Y  = startweight_Y  #            % and original weight matrix
                oldweight_Y  = startweight_Y
                oldwtchange_Y = np.zeros((chans_Y,self.NCOM_Y))  
                delta_Y = np.zeros((1,chans_Y * chans_Y))
                olddelta_Y = delta_Y
                extblocks = urextblocks
                prevweight_Y  = startweight_Y
                prevwtchange_Y = np.zeros((chans_Y,self.NCOM_Y))
                lrates_Y = np.zeros((1,maxsteps))
                bias_Y = np.zeros((self.NCOM_Y, 1))
                
                if extended : 
                    signs_Y = np.ones((1,self.NCOM_Y))  #% initialize signs to nsub -1, rest +1
            
                    for k in range(1,nsub) :
                        signs_Y[k] = -1
                    # end for
                    signs_Y = np.diag(signs_Y) # % make a diagonal matrix
                    oldsigns_Y = np.zeros(signs_Y.size)
                # end if extended
                if lrate_Y > MIN_LRATE :
                    r =  matrix_rank(data2)                        
                    if r < self.NCOM_Y :
                        print('Data has rank %d. Cannot compute %d components.' %( r,self.NCOM_Y))
                        return
                    else : 
                        print('Lowering learning rate to %g and starting again.' %lrate_Y)
                    #end if
                else :
                    print('runica(): QUITTING - weight matrix may not be invertible!')
                    return
                #end if 
            else  : #% if DATA1 weights in bounds
                # %testing the trend of entropy term, avoiding the overfitting of correlation

                u = np.dot(weight_Y , data2 [:, :]) + bias_Y * np.ones((1,frames_Y))
                y = 1/(1 + np.exp(-u))
                temp = np.log(abs( (np.dot(weight_Y,y) * (1-y) ) + eps))
                lossf_Y[STEP_Y] = np.mean(temp) 
                
                #%changes of entropy term added by jingyu
                if STEP_Y > 1 :
                    entropychange_Y = lossf_Y[STEP_Y] - entropy_Y
                else :
                    entropychange_Y = 1
                #end
                #%--------
                
                if STEP_Y > 5 :
                    index_Y = ica_fuse_falsemaxdetect(self, lossf_Y,trendPara)
                    if index_Y :
                        Crate_Y  = Crate_Y*0.9 #         % anneal learning rate empirical
                    # end if
                #end % end of test------------------------

                # %%%%%%%%%%%%% Print weight update information %%%%%%%%%%%%%%%%%%%%%%
                # %
                change_Y = float(change_Y.real)
                oldchange_Y = float(oldchange_Y.real) 

                if STEP_Y  > 2 and not STOPSIGN_Y :
                    # angledelta_Y = math.acos(np.dot(delta_Y , olddelta_Y.T )/ np.sqrt(change_Y * oldchange_Y ))
                    # angledelta_Y = math.acos(np.dot(delta_Y , olddelta_Y.T )/ np.sqrt(np.dot(change_Y,oldchange_Y) ))
                    # y = float(change_Y.real)
                    # z = float(oldchange_Y.real) 
                    change_temp = np.sqrt( float(change_Y.real) * float(oldchange_Y.real) )
                    delta_temp = np.dot(delta_Y , olddelta_Y.T )
                    angledelta_Y = math.acos(delta_temp/  change_temp    )  # (1, 64) x (1, 64).T
                    # angledelta_Y = 1

                #end
                if verbose :
                    if STEP_Y > 2 :
                        if not extended :
                            print('Dataset Y step %d - lrate %5f, wchange %7.6f, angledelta %4.1f deg' 
                                %( STEP_Y, lrate_Y, change_Y, degconst*angledelta_Y) )
                        else :
                            print('Dataset Y step %d - lrate %5f, wchange %7.6f, angledelta %4.1f deg, %d subgauss' 
                                %( STEP_Y, lrate_Y, change_Y, degconst*angledelta_Y, (self.NCOM_Y - sum(np.diag(signs_Y)))/2)) 
                        #end
                    elif not extended :
                        # print('Dataset Y step %d - lrate %5f, wchange %7.6f' %(STEP_Y, lrate_Y, change_Y))
                        print('Dataset Y step %d - lrate %5f, wchange %7.6f' %(STEP_Y, lrate_Y, change_Y))
                    else:
                        print('Dataset Y step %d - lrate %5f, wchange %7.6f, %d subgauss' 
                            %( STEP_Y, lrate_Y, change_Y, (self.NCOM_Y - sum(np.diag(signs_Y)))/2))
                    #end % step > 2
        
                # %%%%%%%%%%%%%%%%%%%% Anneal learning rate %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                # %
                if entropychange_Y < 0  : #%| degconst*angledelta(1) > annealdeg,
                    lrate_Y = lrate_Y * annealstep #          % anneal learning rate
                    olddelta_Y = delta_Y  #                % accumulate angledelta until
                    oldchange_Y  = change_Y #              %  annealdeg is reached
                elif STEP_Y == 1 : #                     % on first step only
                    olddelta_Y   = delta_Y #                % initialize
                    oldchange_Y  = change_Y
                # end
                
                #%%%%%%%%%%%%%%%%%%%% Apply stopping rule %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                # Apply stopping rule               
                if STEP_Y  > 2 and change_Y < nochange:    # apply stopping rule
                    STOPSIGN_Y  = 1                    # stop when weights stabilize
                    print ("STOPSIGN_Y = True")                        
                elif STEP_Y  >= maxsteps :
                    STOPSIGN_Y  = 1                    # max step
                    print ("STOPSIGN_Y = True")                        
                elif change_Y > DEFAULT_BLOWUP :       # if weights blow up,
                    lrate_Y = lrate_Y * DEFAULT_BLOWUP_FAC    # keep trying with a smaller learning rate
                # end if
                # %%%%%%%%%%%%%%%%%% Save current values %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
                oldweight_Y  = weight_Y

            #end; % end if weights in bounds
        # end if ~stopsign(2) 


        self.GlobalPCA_U_X = data1
        self.GlobalPCA_U_Y = data2

        GlobalW_unmixer_X = weight_X
        GlobalA_mixer_X  = inv(GlobalW_unmixer_X)
        GlobalW_unmixer_Y = weight_Y
        GlobalA_mixer_Y  = inv(GlobalW_unmixer_Y)   
        S_sources_X =    np.dot(weight_X, self.GlobalPCA_U_X)       
        S_sources_Y =    np.dot(weight_Y, self.GlobalPCA_U_Y)   
        # print('[LOG][Flow_5_Global_ICA]=====Print all Modality Global Weight shape=====')    

        # print('[LOG][Flow_5_Global_ICA]=====End=====')   
        # print('[LOG][Flow_5_Global_ICA]===== Check_I_X=====')   

        

        #
        # Parrelle ICA - Correlation A
        #
        # print('[LOG][Flow_7_Parallel_ICA-Correlation_A]=====Start=====')   

        # Parallel ICA - Find Correlation local A       

        # print('[LOG][Flow_7_Parallel_ICA-Correlation_A]=====Modality_X and _Y : Find Correlation A=====')

        # Parrelle ICA start
        # Parrelle ICA - Local reconstruction


        # % -------------------------
        # % modifying weights based on correlation between data1 A Matrix and data2 A Matrix
        # % %%%%%%%%%%%%%%%%%nudging

        if (STEP_X >2 and STEP_Y > 2) and ( not STOPSIGN_X or not STOPSIGN_Y ) :

            #
            # print('[LOG][Flow_6_Parallel_ICA-Local_reconstruction]=====Start=====')   

            # Parallel ICA - Find local A using GlobalPCA_dewhite_X and Con_deWhite_X    
            # Called Local-reconstruction ; from-Global-to-Local     
            # print('[LOG][Flow_6_Parallel_ICA-Local_reconstruction]=====Modality_X : Find local A using GlobalPCA_dewhite_X and Con_deWhite_X   =====')
            LocalA_All_X = self.local_reconstruction4(GlobalA_mixer_X, \
                self.GlobalPCA_dewhite_X, self.Con_deWhite_X, self.NSUB_All_X, self.NCOM_All_X)   
            # print('[LOG][Flow_6_Parallel_ICA-Local_reconstruction]=====Modality_Y : Find local A using GlobalPCA_dewhite_Y and Con_deWhite_Y   =====')            
            LocalA_All_Y = self.local_reconstruction4(GlobalA_mixer_Y, \
                self.GlobalPCA_dewhite_Y, self.Con_deWhite_Y, self.NSUB_All_Y, self.NCOM_All_Y)               


            mx = LocalA_All_X   # mx = (weights{1}' \ dewhiteM{1}')'; % A matrix of data1
            sx = LocalA_All_Y   # sx = (weights{2}' \ dewhiteM{2}')'  % A matrix of data2
            Corr_matrix = np.abs(ica_fuse_corr(self, mx,sx))  # 8 x 8
            #  % calculate the correlation of all componentsts   % match tow modality components
            j_min = min(int(self.NCOM_X),int(self.NCOM_Y))
            maxcorr=np.zeros(j_min)
            maxcol=np.zeros(j_min)
            maxrow=np.zeros(j_min)

            for j in range(j_min)  :
                [mm,ss] = np.unravel_index(np.argmax(Corr_matrix, axis=None), Corr_matrix.shape)
                maxcol[j] = mm      # 8
                maxrow[j] = ss      # 1
                maxcorr[j] = Corr_matrix[mm,ss]         # 1 x 8
                Corr_matrix[mm,:]=0
                Corr_matrix[:,ss]=0

            # %[temp,index]=sort(abs(maxcorr),'descend');
            temp = np.sort(abs(maxcorr))
            index =   np.arange(len(temp)) 
            ix = np.array(np.where (temp > Connect_threshold)) #ix = find(temp>Connect_threshold)     # Connect_threshold 0.2542 ix = 1x0

            if (np.size(ix)) > MaxComCon :
                ix = ix[0,:MaxComCon]
            if not (np.size(ix)==0) :  # ~isempty(ix) :
                # If not empty, do here
                for Cons_com in range(len(ix)): # % constraned componenets
                    c_i = Cons_com

                    #% Updata the weights
                    a = mx[:,int(maxcol[c_i])].T
                    u = sx[:,int(maxrow[c_i])].T

                    b = np.cov(a,u)  
                    b = b[0,1]
                    tmcorr = b/np.std(a)/np.std(u)
                    comterm = 2*b/np.var(a)/np.var(u)
                    coml = len(a)
                    
                    if not STOPSIGN_X : # %& ~Overindex1
                        deltaf =  comterm*(u-np.mean(u) + b*(np.mean(a)-a)/np.var(a)) # 1st order derivative
                        P = deltaf / np.linalg.norm(deltaf)      # (H1*deltaf')'
                        alphak_X = self.findsteplength1 (-tmcorr**2, -deltaf, a, u, alphak_X, P, 0.0001, 0.999)

                        aweights_temp = Crate_X * alphak_X * P 
                        mx[:,int(maxcol[c_i])] = mx[:, int(maxcol[c_i])] + aweights_temp.T
                    # end if not STOPSIGN_X 

                    if not STOPSIGN_Y : # not Overindex1 
                        deltaf = (comterm * (a - np.mean(a) + b/np.var(u)*(np.mean(u) - u)))   # 1st order derivative
                        P = deltaf / np.linalg.norm(deltaf)      # (H2*deltaf')'
                        alphak_Y = self.findsteplength1 (-tmcorr**2, -deltaf, u, a, alphak_Y, P, 0.0001, 0.999)
                        aweights_temp = Crate_Y * alphak_Y * P
                        sx[:,int(maxrow[c_i])] = sx[:,int(maxrow[c_i])] + aweights_temp.T
                    # end if not STOPSIGN_Y     


                # end for Cons_com 

                #
                # Parrelle ICA - Global reconstruction
                #
                # print('[LOG][Flow_8_Parallel_ICA-Global_reconstruction]=====Start=====')   

                if not STOPSIGN_X :
                    temp = weight_X 

                    # Parallel ICA - Find Global A (Flow#5) using Con_White_X and GlobalPCA_White_X 
                    # Called Global-reconstruction ; from-Local-to-Global     
                    # print('[LOG][Flow_8_Parallel_ICA-Global_reconstruction]=====Modality_X : Find Global A (Flow#5) using Con_White_X and GlobalPCA_White_X====')

                    # GlobalA_mixer_X = self.global_reconstruction(mx, 
                    #     self.GlobalPCA_White_X, self.Con_White_X, self.NSUB_All_X, self.NCOM_All_X)  
                    GlobalA_mixer_X = self.global_reconstruction3(mx, 
                        self.GlobalPCA_White_X, self.Con_White_X, self.NSUB_All_X, self.NCOM_All_X)  

                    # Print all Modality Correlation A shape
                    # print('[LOG][Flow_8_Parallel_ICA-Global_reconstruction]=====Print all Modality Global A shape=====')
                    # print('Modality_X === GlobalA_mixer_X (r_X x r_X)',GlobalA_mixer_X.shape )


                    #
                    # Parrelle ICA - Global Weight update
                    #
                    # print('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update]=====Start=====')   

                    # Parallel ICA - Update Global Weight of all Modality from Global A mixer
                    # print('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update]=====Update Global Weight of all Modality from Global A mixer=====')
                    weight_X = inv(GlobalA_mixer_X) #% weights{1} \ eye(size(weights{1}));


                    if np.amax(abs(weight_X)) > MAX_WEIGHT :
                        Crate_X = Crate_X *0.95
                        weight_X = temp
                    # end if
                # end if not STOPSIGN_X :

                if not STOPSIGN_Y :
                    temp = weight_Y 

                    # Parallel ICA - Find Global A (Flow#5) using Con_White_X and GlobalPCA_White_X 
                    # Called Global-reconstruction ; from-Local-to-Global  
                    # print('[LOG][Flow_8_Parallel_ICA-Global_reconstruction]=====Modality_Y : Find Global A (Flow#5) using Con_White_Y and GlobalPCA_White_Y====')

                    GlobalA_mixer_Y = self.global_reconstruction3(sx, 
                        self.GlobalPCA_White_Y, self.Con_White_Y, self.NSUB_All_Y, self.NCOM_All_Y)  
                    # Print all Modality Correlation A shape
                    # print('[LOG][Flow_8_Parallel_ICA-Global_reconstruction]=====Print all Modality Global A shape=====')
                    # print('Modality_X === GlobalA_mixer_X (r_X x r_X)',GlobalA_mixer_X.shape )
                    # print('Modality_Y === GlobalA_mixer_Y (r_Y x r_Y)',GlobalA_mixer_Y.shape )

                    # print('[LOG][Flow_8_Parallel_ICA-Global_reconstruction]=====End=====')   

                    #
                    # Parrelle ICA - Global Weight update
                    #
                    # print('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update]=====Start=====')   

                    # Parallel ICA - Update Global Weight of all Modality from Global A mixer
                    # print('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update]=====Update Global Weight of all Modality from Global A mixer=====')
                    weight_Y = inv(GlobalA_mixer_Y) #% weights{1} \ eye(size(weights{1}));


                    if np.amax(abs(weight_Y)) > MAX_WEIGHT :
                        Crate_Y = Crate_Y *0.95
                        weight_Y = temp
                    # end if
                # end if not STOPSIGN_Y :

                #%             test ---------------------
                # This is for testing and validating if Weight is in Wrong direction or NOT.
                # print('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update] Testing and validating ===== Start =====')
                LocalA_All_X = self.local_reconstruction3(inv(weight_X), \
                    self.GlobalPCA_dewhite_X, self.Con_deWhite_X, self.NSUB_All_X, self.NCOM_All_X)                    
                LocalA_1_X = LocalA_All_X[:int(self.NSUB_All_X[0]), :]
                LocalA_All_Y = self.local_reconstruction3(inv(weight_Y), \
                    self.GlobalPCA_dewhite_Y, self.Con_deWhite_Y, self.NSUB_All_Y, self.NCOM_All_Y)                    
                LocalA_1_Y = LocalA_All_Y[:int(self.NSUB_All_Y[0]), :]

                LocalA_1_X = LocalA_All_X[:int(self.NSUB_All_X[0]), :]
                LocalA_1_Y = LocalA_All_Y[:int(self.NSUB_All_Y[0]), :]

                sx = LocalA_1_Y  # sx = (weights{2}' \ dewhiteM{2}')';
                mx = LocalA_1_X   # mx = (weights{1}' \ dewhiteM{1}')';

                a = mx[:,int(maxcol[index[0]])]  # a = 2 x 4
                b = sx[:,int(maxrow[index[0]])]  # index 1 x 8     maxrow 1 x 8
                
                temp =  np.corrcoef(a,b)
                temp = temp[0,1]  #;% correlation           
                if abs(temp) < maxcorr[0] : 
                    # print ('Wrong direction !!!! ')
                    print ('Please check the maxinum correlation!!!! ')                    
                # end if
                #lossf3(max(STEP_X, STEP_Y)) = abs (temp)  # Not exist
                #%             -----------------end test
                oldweight_Y = weight_Y # 8x8
                oldweight_X = weight_X # 8x8
                # print('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update] Testing and validating ===== Finish =====')


            #end if ~ isempty(ix) :
                        
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
        # print('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update]=====Start=====')   

        # Parallel ICA - Update Global Weight of all Modality from Global A mixer
        # print('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update]=====Update Global Weight of all Modality from Global A mixer=====')


        GlobalW_unmixer_X = weight_X
        GlobalW_unmixer_Y = weight_Y 

        # print('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update]=====End=====')   


    # End of IF Flow 6 - Flow 8a

    # End while (STEP_X < maxsteps or STEP_Y < maxsteps) :



    if ((change_X  > nochange) or (change_Y > nochange)) : 
        if ( (STEP_X) == (maxsteps)  or (STEP_Y) == (maxsteps) ):
            print('!!!Reached max steps. Please reduce the constrained components in setup options and restart parallel ica.')
        # end if
    # end if


    print("[LOG]=====INFOMAX=====Current_STEP_X = ", STEP_LAST_X  , " and STEP_Y  =" , STEP_LAST_Y ,\
        "STOPSIGN_X = ", STOPSIGN_X , " STOPSIGN_Y  = ", STOPSIGN_Y )     
    # print("[LOG]=====INFOMAX=====Actual_STEP_X = ", STEP_X  , " and STEP_Y  =" , STEP_Y )    
    # Return
    # print('INFOMAX...Return====A,S,W,STEP,STOPSIGN as inv(weights), dot(weights, x_white), weights, STEP, STOPSIGN.===')     
    print("[LOG]=====INFOMAX=====Finish")        
    # return (inv(weights), dot(weights, x_white), weights, step, stopsign)

    print('[LOG][Flow_5_Global_ICA]')
    print('[LOG][Flow_6_Parallel_ICA-Local_reconstruction]')   
    print('[LOG][Flow_7_Parallel_ICA-Correlation_A]')           
    print('[LOG][Flow_8_Parallel_ICA-Global_reconstruction]')
    print('[LOG][Flow_8a_Parallel_ICA-Global_Weight_update]') 
    
    np.savetxt( DATA_PATH_OUTPUT  + "GlobalA_mixer_X_" + str(self.run) + ".csv", GlobalA_mixer_X, delimiter=",")
    np.savetxt( DATA_PATH_OUTPUT  + "S_sources_X_" + str(self.run) + ".csv", S_sources_X, delimiter=",")
    np.savetxt( DATA_PATH_OUTPUT  + "GlobalW_unmixer_X_" + str(self.run) + ".csv", GlobalW_unmixer_X, delimiter=",")
    np.savetxt( DATA_PATH_OUTPUT  + "GlobalA_mixer_Y_" + str(self.run) + ".csv", GlobalA_mixer_Y, delimiter=",")
    np.savetxt( DATA_PATH_OUTPUT  + "S_sources_Y_" + str(self.run) + ".csv", S_sources_Y, delimiter=",")
    np.savetxt( DATA_PATH_OUTPUT  + "GlobalW_unmixer_Y_" + str(self.run) + ".csv", GlobalW_unmixer_Y, delimiter=",")

    print('[LOG][Flow_8a_Parallel_ICA-Global] Save all A, W, S cvs files.') 
    print('[LOG][Flow_8a_Parallel_ICA-Global] Finish run ', str(self.run), ".") 

    return (self, GlobalA_mixer_X, S_sources_X, GlobalW_unmixer_X, \
                  GlobalA_mixer_Y, S_sources_Y, GlobalW_unmixer_Y )

def pica_infomax_run_average2(self, XY, num_ica_runs, GlobalPCA_U,  m1, m2, m3, m4, m5):    
    """Computes average ICA 
    *Input
        m1, m2, m3, m4, m5 : Globa W unmixer matrix from Infomax (components x components)
        num_ica_runs : Number of times to run ica    
        XY  : Modality X or Y
    *Output
        A : GlobalA_mixer_X : mixing matrix
        S : S_sources_X : source matrix
        W : GlobalW_unmixer : unmixing matrix
    """
    NCOMP, r = m1.shape

    #########################
    # Normalizing
    #########################
    # Normalize m1, m2, m3, m4, m5 by removing mean 
    # print('[LOG][Multirun ICA] De-mean ')



    #########################
    # Clustering
    #########################
    # Using the ordered cross-correlation algorithm
    print('[LOG][Multirun ICA] Clustering ')
    data_path_save = DATA_PATH_OUTPUT    

            # def pica_2d_correlate7(Corr_X, Corr_Y,  data_path_save, data_file_save, screenshow=False, pltshow=False, pltsave=False):

    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m2.jpeg"    
    coef_m1_m2 = dpica_report_v3.pica_2d_correlate5(m1, m2, data_path_save, data_file_save, True, True)    # 
    # print('[LOG][Multirun ICA] Clustering. Save ', data_file_save)

    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m3.jpeg"    
    coef_m1_m3 = dpica_report_v3.pica_2d_correlate5(m1, m3, data_path_save, data_file_save, True, True)    # 
    # print('[LOG][Multirun ICA] Clustering. Save ', data_file_save)

    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m4.jpeg"    
    coef_m1_m4 = dpica_report_v3.pica_2d_correlate5(m1, m4, data_path_save, data_file_save, True, True)    # 
    # print('[LOG][Multirun ICA] Clustering. Save ', data_file_save)

    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m5.jpeg"    
    coef_m1_m5 = dpica_report_v3.pica_2d_correlate5(m1, m5, data_path_save, data_file_save, True, True)    # 
    # print('[LOG][Multirun ICA] Clustering. Save ', data_file_save)

    # Define m1 index 
    m1_ordered = m1


    # Finding numximum pair index m1 vs m2
    max_index_row = np.argmax(abs(coef_m1_m2), axis=1)         # [7, 0, 1, 2, 3, 4, 5, 6]  wrong [1, 1, 7, 5, 1, 3, 1, 5]
    m2_ordered = m2[max_index_row,:]        # Rearrange m2 in max_index_row(m1) order.
    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m2_ordered.jpeg"    
    coef_m1_m2_ordered = dpica_report_v3.pica_2d_correlate5(m1_ordered, m2_ordered, data_path_save, data_file_save, True, True)    
    # print('[LOG][Multirun ICA] Clustering. Save ', data_file_save)

    # Finding numximum pair index m1 vs m3
    max_index_row = np.argmax(abs(coef_m1_m3), axis=1)        # [6, 7, 0, 1, 2, 3, 4, 5]
    m3_ordered = m3[max_index_row,:]        # Rearrange m3 in max_index_row(m1) order.
    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m3_ordered.jpeg"    
    coef_m1_m3_ordered = dpica_report_v3.pica_2d_correlate5(m1_ordered, m3_ordered, data_path_save, data_file_save, True, True)    
    # print('[LOG][Multirun ICA] Clustering. Save ', data_file_save)

    # Finding numximum pair index m1 vs m4
    max_index_row = np.argmax(abs(coef_m1_m4), axis=1)         # [5, 6, 7, 0, 1, 2, 3, 4]
    m4_ordered = m4[max_index_row,:]        # Rearrange m4 in max_index_row(m1) order.
    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m4_ordered.jpeg"    
    coef_m1_m4_ordered = dpica_report_v3.pica_2d_correlate5(m1_ordered, m4_ordered, data_path_save, data_file_save, True, True)    
    # print('[LOG][Multirun ICA] Clustering. Save ', data_file_save)

    # Finding numximum pair index m1 vs m5
    max_index_row = np.argmax(abs(coef_m1_m5), axis=1)         # [4, 5, 6, 7, 0, 1, 2, 3]  wrong [6, 6, 4, 2, 6, 0, 6, 2]
    m5_ordered = m5[max_index_row,:]        # Rearrange m5 in max_index_row(m1) order.
    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m5_ordered.jpeg"    
    coef_m1_m5_ordered = dpica_report_v3.pica_2d_correlate5(m1_ordered, m5_ordered, data_path_save, data_file_save, True, True)    
    # print('[LOG][Multirun ICA] Clustering. Save ', data_file_save)

    print('[LOG][Multirun ICA] Clustering - Finish')

    #########################
    # Re-arrange  positive/negative pattern
    #########################
    # Using the -1 algorithm (not absolute algorithm)
    print('[LOG][Multirun ICA] Re-arranging - pattern')

    # m1 Vs m2, m3, m4, m5
    for i in range(NCOMP) :
        # Number of run = (num_ica_runs) 
        # print("coef_m1_m2_ordered [", i , ",", i, "] = ", coef_m1_m2_ordered[i,i] )
        # print("coef_m1_m3_ordered [", i , ",", i, "] = ", coef_m1_m3_ordered[i,i] )
        # print("coef_m1_m4_ordered [", i , ",", i, "] = ", coef_m1_m4_ordered[i,i] )
        # print("coef_m1_m5_ordered [", i , ",", i, "] = ", coef_m1_m5_ordered[i,i] )

        ## Switch current row to opposite sign
        if coef_m1_m2_ordered[i,i] < 0 : 
            m2_ordered[i] = -1 * m2_ordered[i]
            print("[LOG][Multirun ICA] Re-arranging - Component ", i , "of m2_[",i,"] is appied -1. ")    
        if coef_m1_m3_ordered[i,i] < 0 : 
            m3_ordered[i] = -1 * m3_ordered[i]
            print("[LOG][Multirun ICA] Re-arranging - Component ", i , "of m3_[",i,"] is appied -1. ")    
        if coef_m1_m4_ordered[i,i] < 0 : 
            m4_ordered[i] = -1 * m4_ordered[i]
            print("[LOG][Multirun ICA] Re-arranging - Component ", i , "of m4_[",i,"] is appied -1. ")    
        if coef_m1_m5_ordered[i,i] < 0 : 
            m5_ordered[i] = -1 * m5_ordered[i]
            print("[LOG][Multirun ICA] Re-arranging - Component ", i , "of m5_[",i,"] is appied -1. ")                        

    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m2_ordered_flipped.jpeg"   
    coef_m1_m2_ordered = dpica_report_v3.pica_2d_correlate5(m1_ordered, m2_ordered, data_path_save, data_file_save, True, True)    
    # print('[LOG][Multirun ICA] Re-arranging - pattern. Save ', data_file_save)  

    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m3_ordered_flipped.jpeg"   
    coef_m1_m3_ordered = dpica_report_v3.pica_2d_correlate5(m1_ordered, m3_ordered, data_path_save, data_file_save, True, True)    
    # print('[LOG][Multirun ICA] Re-arranging - pattern. Save ', data_file_save)  

    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m4_ordered_flipped.jpeg"       
    coef_m1_m4_ordered = dpica_report_v3.pica_2d_correlate5(m1_ordered, m4_ordered, data_path_save, data_file_save, True, True)    
    # print('[LOG][Multirun ICA] Re-arranging - pattern. Save ', data_file_save)  

    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m5_ordered_flipped.jpeg"   
    coef_m1_m5_ordered = dpica_report_v3.pica_2d_correlate5(m1_ordered, m5_ordered, data_path_save, data_file_save, True, True)    
    # print('[LOG][Multirun ICA] Re-arranging - pattern. Save ', data_file_save)  

    print('[LOG][Multirun ICA] Re-arranging - Finished')


    #########################
    # Computing the final weight W
    #########################
    # Using the Average algorithm
    print('[LOG][Multirun ICA] Average algorithm')

    GlobalW_unmixer = []
    list_m = []
    list_m.append(m1_ordered)
    list_m.append(m2_ordered)
    list_m.append(m3_ordered)
    list_m.append(m4_ordered)
    list_m.append(m5_ordered)

    list_m = np.array(list_m)

    # Compute GlobalA 
    GlobalW_unmixer = np.average(list_m, axis=0)  # [5, 8, 8] ==> [8, 8] Average by row 
    print('[LOG][Multirun ICA] Average algorithm - Done')

    # Compute GlobalA_mixer and S_source
    GlobalA_mixer = inv(GlobalW_unmixer)     
    S_sources = np.dot(GlobalW_unmixer, GlobalPCA_U)       

    return (self, GlobalA_mixer, S_sources, GlobalW_unmixer)

def pica_infomax_run_icasso3(self, XY,  num_ica_runs, GlobalPCA_U,  m1, m2, m3, m4, m5):    
    """Computes ICASSO ICA 
    *Input
        m1, m2, m3, m4, m5 : Globa W unmixer matrix from Infomax (components x components)
        num_ica_runs : Number of times to run ica    
        XY  : Modality X or Y
    *Output
        A : GlobalA_mixer_X : mixing matrix
        S : S_sources_X : source matrix
        W : GlobalW_unmixer : unmixing matrix
    """
    NCOMP, r = m1.shape

    #########################
    # Normalizing
    #########################
    # Normalize m1, m2, m3, m4, m5 by removing mean and by removing standard deviation of the array
     
    # print('[LOG][Multirun ICA] De-mean ')


    #########################
    # Clustering
    #########################
    # Using the ordered cross-correlation algorithm
    print('[LOG][Multirun ICA] Clustering ')
    data_path_save = DATA_PATH_OUTPUT    

    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m2.jpeg"    
    coef_m1_m2 = dpica_report_v3.pica_2d_correlate5(m1, m2, data_path_save, data_file_save, True, True)    # 
    # print('[LOG][Multirun ICA] Clustering. Save ', data_file_save)

    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m3.jpeg"    
    coef_m1_m3 = dpica_report_v3.pica_2d_correlate5(m1, m3, data_path_save, data_file_save, True, True)    # 
    # print('[LOG][Multirun ICA] Clustering. Save ', data_file_save)

    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m4.jpeg"    
    coef_m1_m4 = dpica_report_v3.pica_2d_correlate5(m1, m4, data_path_save, data_file_save, True, True)    # 
    # print('[LOG][Multirun ICA] Clustering. Save ', data_file_save)

    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m5.jpeg"    
    coef_m1_m5 = dpica_report_v3.pica_2d_correlate5(m1, m5, data_path_save, data_file_save, True, True)    # 
    # print('[LOG][Multirun ICA] Clustering. Save ', data_file_save)

    # Define m1 index 
    m1_ordered = m1


    # Finding numximum pair index m1 vs m2
    max_index_row = np.argmax(abs(coef_m1_m2), axis=1)         # [7, 0, 1, 2, 3, 4, 5, 6]  wrong [1, 1, 7, 5, 1, 3, 1, 5]
    m2_ordered = m2[max_index_row,:]        # Rearrange m2 in max_index_row(m1) order.
    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m2_ordered.jpeg"    
    coef_m1_m2_ordered = dpica_report_v3.pica_2d_correlate5(m1_ordered, m2_ordered, data_path_save, data_file_save, True, True)    
    # print('[LOG][Multirun ICA] Clustering. Save ', data_file_save)

    # Finding numximum pair index m1 vs m3
    max_index_row = np.argmax(abs(coef_m1_m3), axis=1)        # [6, 7, 0, 1, 2, 3, 4, 5]
    m3_ordered = m3[max_index_row,:]        # Rearrange m3 in max_index_row(m1) order.
    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m3_ordered.jpeg"    
    coef_m1_m3_ordered = dpica_report_v3.pica_2d_correlate5(m1_ordered, m3_ordered, data_path_save, data_file_save, True, True)    
    # print('[LOG][Multirun ICA] Clustering. Save ', data_file_save)

    # Finding numximum pair index m1 vs m4
    max_index_row = np.argmax(abs(coef_m1_m4), axis=1)         # [5, 6, 7, 0, 1, 2, 3, 4]
    m4_ordered = m4[max_index_row,:]        # Rearrange m4 in max_index_row(m1) order.
    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m4_ordered.jpeg"    
    coef_m1_m4_ordered = dpica_report_v3.pica_2d_correlate5(m1_ordered, m4_ordered, data_path_save, data_file_save, True, True)    
    # print('[LOG][Multirun ICA] Clustering. Save ', data_file_save)

    # Finding numximum pair index m1 vs m5
    max_index_row = np.argmax(abs(coef_m1_m5), axis=1)         # [4, 5, 6, 7, 0, 1, 2, 3]  wrong [6, 6, 4, 2, 6, 0, 6, 2]
    m5_ordered = m5[max_index_row,:]        # Rearrange m5 in max_index_row(m1) order.
    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m5_ordered.jpeg"    
    coef_m1_m5_ordered = dpica_report_v3.pica_2d_correlate5(m1_ordered, m5_ordered, data_path_save, data_file_save, True, True)    
    # print('[LOG][Multirun ICA] Clustering. Save ', data_file_save)

    print('[LOG][Multirun ICA] Clustering - Finish')

    #########################
    # Re-arrange  positive/negative pattern
    #########################
    # Using the -1 algorithm (not absolute algorithm)
    print('[LOG][Multirun ICA] Re-arranging - pattern')

    # m1 Vs m2, m3, m4, m5
    for i in range(NCOMP) :
        # Number of run = (num_ica_runs) 
        # print("coef_m1_m2_ordered [", i , ",", i, "] = ", coef_m1_m2_ordered[i,i] )
        # print("coef_m1_m3_ordered [", i , ",", i, "] = ", coef_m1_m3_ordered[i,i] )
        # print("coef_m1_m4_ordered [", i , ",", i, "] = ", coef_m1_m4_ordered[i,i] )
        # print("coef_m1_m5_ordered [", i , ",", i, "] = ", coef_m1_m5_ordered[i,i] )

        ## Switch current row to opposite sign
        if coef_m1_m2_ordered[i,i] < 0 : 
            m2_ordered[i] = -1 * m2_ordered[i]
            print("[LOG][Multirun ICA] Re-arranging - Component ", i , "of m2_[",i,"] is appied -1. ")    
        if coef_m1_m3_ordered[i,i] < 0 : 
            m3_ordered[i] = -1 * m3_ordered[i]
            print("[LOG][Multirun ICA] Re-arranging - Component ", i , "of m3_[",i,"] is appied -1. ")    
        if coef_m1_m4_ordered[i,i] < 0 : 
            m4_ordered[i] = -1 * m4_ordered[i]
            print("[LOG][Multirun ICA] Re-arranging - Component ", i , "of m4_[",i,"] is appied -1. ")    
        if coef_m1_m5_ordered[i,i] < 0 : 
            m5_ordered[i] = -1 * m5_ordered[i]
            print("[LOG][Multirun ICA] Re-arranging - Component ", i , "of m5_[",i,"] is appied -1. ")                        
    # End or for i loop.

    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m2_ordered_flipped.jpeg"   
    coef_m1_m2_ordered = dpica_report_v3.pica_2d_correlate5(m1_ordered, m2_ordered, data_path_save, data_file_save, True, True)    
    # print('[LOG][Multirun ICA] Re-arranging - pattern. Save ', data_file_save)  

    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m3_ordered_flipped.jpeg"   
    coef_m1_m3_ordered = dpica_report_v3.pica_2d_correlate5(m1_ordered, m3_ordered, data_path_save, data_file_save, True, True)    
    # print('[LOG][Multirun ICA] Re-arranging - pattern. Save ', data_file_save)  

    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m4_ordered_flipped.jpeg"       
    coef_m1_m4_ordered = dpica_report_v3.pica_2d_correlate5(m1_ordered, m4_ordered, data_path_save, data_file_save, True, True)    
    # print('[LOG][Multirun ICA] Re-arranging - pattern. Save ', data_file_save)  

    data_file_save =  "Correlation_Graph_"  + XY + "_m1_m5_ordered_flipped.jpeg"   
    coef_m1_m5_ordered = dpica_report_v3.pica_2d_correlate5(m1_ordered, m5_ordered, data_path_save, data_file_save, True, True)    
    # print('[LOG][Multirun ICA] Re-arranging - pattern. Save ', data_file_save)  

    print('[LOG][Multirun ICA] Re-arranging - Finished')

    #########################
    # Computing the final weight W
    #########################
    # Using the Centrotype algorithm
    print('[LOG][Multirun ICA] Centrotype algorithm')

    GlobalW_unmixer = []
    list_m = []

    # m1 Vs m2, m3, m4, m5
    for i in range(NCOMP) :        
        coef_max_sum_list = []
        coef_max_sum = -1
        # m1 Vs m2
        data_file_save =  "Correlation_Graph_"  + XY + "_ICASSO_component_" + str(i) + "_m1_m2.jpeg"   
        coef_component_m1_m2_file = dpica_report_v3.pica_2d_correlate6(m1_ordered[i], m2_ordered[i], data_path_save, data_file_save, False, False, True)           
        coef_component_m1_m2 = np.corrcoef ( m1_ordered[i], m2_ordered[i] )
        coef_component_m1_m2_sum = np.sum(coef_component_m1_m2)
        print("[LOG][Multirun ICA] Centrotype - Component ", i , " coef_component_m1_m2_sum = " , coef_component_m1_m2_sum)    

        # m1 Vs m3
        data_file_save =  "Correlation_Graph_"  + XY + "_ICASSO_component_"+ str(i) + "_m1_m3.jpeg"   
        coef_component_m1_m3_file = dpica_report_v3.pica_2d_correlate6(m1_ordered[i], m3_ordered[i], data_path_save, data_file_save, False, False, True)           
        coef_component_m1_m3 = np.corrcoef ( m1_ordered[i], m3_ordered[i] )
        coef_component_m1_m3_sum = np.sum(coef_component_m1_m3)
        print("[LOG][Multirun ICA] Centrotype - Component ", i , " coef_component_m1_m3_sum = " , coef_component_m1_m3_sum)    
        if coef_component_m1_m2_sum > coef_component_m1_m3_sum :
                coef_max_sum_list = m2_ordered[i]
                coef_max_sum = coef_component_m1_m2_sum
                print("[LOG][Multirun ICA] Centrotype - Component ", i , " m1m2 coef_max_sum = " , coef_max_sum)    

        else :            
                coef_max_sum_list = m3_ordered[i]
                coef_max_sum = coef_component_m1_m3_sum
                print("[LOG][Multirun ICA] Centrotype - Component ", i , " m1m3 coef_max_sum = " , coef_max_sum)    
        
        # m1 Vs m4
        data_file_save =  "Correlation_Graph_"  + XY + "_ICASSO_component_"+ str(i) + "_m1_m4.jpeg"   
        coef_component_m1_m4_file = dpica_report_v3.pica_2d_correlate6(m1_ordered[i], m4_ordered[i], data_path_save, data_file_save, False, False, True)           
        coef_component_m1_m4 = np.corrcoef ( m1_ordered[i], m4_ordered[i] )
        coef_component_m1_m4_sum = np.sum(coef_component_m1_m4)
        print("[LOG][Multirun ICA] Centrotype - Component ", i , " coef_component_m1_m4_sum = " , coef_component_m1_m4_sum)    
        if coef_component_m1_m4_sum > coef_max_sum:
                coef_max_sum_list = m4_ordered[i]
                coef_max_sum = coef_component_m1_m4_sum
                print("[LOG][Multirun ICA] Centrotype - Component ", i , " m1m4 coef_max_sum = " , coef_max_sum)    

        # m1 Vs m5
        data_file_save =  "Correlation_Graph_"  + XY + "_ICASSO_component_"+ str(i) + "_m1_m5.jpeg"   
        coef_component_m1_m5_file = dpica_report_v3.pica_2d_correlate6(m1_ordered[i], m5_ordered[i], data_path_save, data_file_save, False, False, True)           
        coef_component_m1_m5 = np.corrcoef ( m1_ordered[i], m5_ordered[i] )
        coef_component_m1_m5_sum = np.sum(coef_component_m1_m5)
        print("[LOG][Multirun ICA] Centrotype - Component ", i , " coef_component_m1_m5_sum = " , coef_component_m1_m5_sum)    
        if coef_component_m1_m5_sum > coef_max_sum:
                coef_max_sum_list = m5_ordered[i]
                coef_max_sum = coef_component_m1_m5_sum
                print("[LOG][Multirun ICA] Centrotype - Component ", i , " m1m5 coef_max_sum = " , coef_max_sum)    

        print("[LOG][Multirun ICA] Centrotype - Component ", i , " coef_max_sum_list = " , coef_max_sum_list)    

        list_m.append(coef_max_sum_list)
        print("[LOG][Multirun ICA] Centrotype - Component ", i , " list_m = " , len(list_m), ".")


    #     i = i + 1  # Loop to next component.
    # End or for loop.

    list_m = np.array(list_m)

    # Compute GlobalA 
    GlobalW_unmixer = list_m

    print('[LOG][Multirun ICA] Centrotype algorithm - Done')

    # Compute GlobalA_mixer and S_source
    GlobalA_mixer = inv(GlobalW_unmixer)     
    S_sources = np.dot(GlobalW_unmixer, GlobalPCA_U)       

    return (self, GlobalA_mixer, S_sources, GlobalW_unmixer)



if __name__ == '__main__':
    print('main')
    unittest.main()
    print('End of main')