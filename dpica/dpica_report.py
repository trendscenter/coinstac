'''
Reference: Parallel Independent Component Analysis (pICA): (Liu et al. 2009)

Code deverloper : cpanichvatana1@student.gsu.edu
Version : 4.0 on 6/17/2021

'''
#######################################################
# This section is for managing report of pICA.
# Researcher: Mart Panichvatana
########################################################
import os
import nibabel as nib
from nibabel.testing import data_path
import numpy as np
import matplotlib.pyplot as plt
import scipy.stats


def pica_MathLab_A_import(data_path_input, \
    Modality_X_filename_input, \
    Modality_Y_filename_input):

    ########################################################
    # print('Modality_X_filename_input = ',Modality_X_filename_input)
    # print('Modality_Y_filename_input = ',Modality_Y_filename_input)

    Modality_X_mathlab_1d_all = []
    Modality_Y_mathlab_1d_all = []

    if Modality_X_filename_input :
        # print('Modality_X_filename_input = ',Modality_X_filename_input)
        fname = os.path.join(data_path_input, Modality_X_filename_input)

        Modality_X_mathlab_1d_all = np.genfromtxt(fname, dtype=float )
        # print("Modality_X_mathlab_2d_all_len = ", len(Modality_X_mathlab_2d_all))
        Modality_X_mathlab_2d_all = np.asarray(Modality_X_mathlab_1d_all)
        # print("Modality_X_mathlab_2d_all.shape = " , Modality_X_mathlab_2d_all.shape )
        # print("Modality_X_mathlab_2d_all = " , Modality_X_mathlab_2d_all )


    if Modality_Y_filename_input :
        # print('Modality_Y_filename_input = ',Modality_Y_filename_input)
        fname = os.path.join(data_path_input, Modality_Y_filename_input)

        Modality_Y_mathlab_1d_all = np.genfromtxt(fname, dtype=float )
        # print("Modality_Y_mathlab_2d_all_len = ", len(Modality_Y_mathlab_2d_all))
        Modality_Y_mathlab_2d_all = np.asarray(Modality_Y_mathlab_1d_all)
        # print("Modality_Y_mathlab_2d_all.shape = " , Modality_Y_mathlab_2d_all.shape )
        # print("Modality_Y_mathlab_2d_all = " , Modality_Y_mathlab_2d_all )

       

    ########################################################
    return (Modality_X_mathlab_2d_all, Modality_Y_mathlab_2d_all)   

def pica_MathLab_S_import(data_path_input, \
    Modality_X_filename_input, \
    Modality_Y_filename_input):

    ########################################################
    # print('Modality_X_filename_input = ',Modality_X_filename_input)
    # print('Modality_Y_filename_input = ',Modality_Y_filename_input)

    Modality_X_mathlab_1d_all = []
    Modality_Y_mathlab_1d_all = []

    if Modality_X_filename_input :
        # print('Modality_X_filename_input = ',Modality_X_filename_input)
        fname = os.path.join(data_path_input, Modality_X_filename_input)

        Modality_X_mathlab_1d_all = np.genfromtxt(fname, dtype=float )
        # print("Modality_X_mathlab_2d_all_len = ", len(Modality_X_mathlab_2d_all))
        Modality_X_mathlab_2d_all = np.asarray(Modality_X_mathlab_1d_all)
        # print("Modality_X_mathlab_2d_all.shape = " , Modality_X_mathlab_2d_all.shape )
        # print("Modality_X_mathlab_2d_all = " , Modality_X_mathlab_2d_all )


    if Modality_Y_filename_input :
        # print('Modality_Y_filename_input = ',Modality_Y_filename_input)
        fname = os.path.join(data_path_input, Modality_Y_filename_input)

        Modality_Y_mathlab_1d_all = np.genfromtxt(fname, dtype=float )
        # print("Modality_Y_mathlab_2d_all_len = ", len(Modality_Y_mathlab_2d_all))
        Modality_Y_mathlab_2d_all = np.asarray(Modality_Y_mathlab_1d_all)
        # print("Modality_Y_mathlab_2d_all.shape = " , Modality_Y_mathlab_2d_all.shape )
        # print("Modality_Y_mathlab_2d_all = " , Modality_Y_mathlab_2d_all )

    return (Modality_X_mathlab_2d_all, Modality_Y_mathlab_2d_all)   


def pica_2d_correlate5(Corr_X, Corr_Y,  data_path_save, data_file_save, pltshow=False, pltsave=False):



    Coef_X_Y = np.corrcoef ( Corr_X, Corr_Y  )

    # Reshap to one quarter.      
    ic_num = int((Coef_X_Y.shape[0])/2)
    Coef_X_Y = Coef_X_Y[:ic_num,-ic_num:]
    print('Coef_X_Y  rehape (N) x (N))', Coef_X_Y.shape )    #  (8, 8)
    # print('Coef_X_Y   = ', Coef_X_Y  )    

    # Round an array to the given number of decimals.
    Coef_X_Y = np.round(Coef_X_Y,8)

    # flatten
    coef_X_Y_flat = Coef_X_Y.flatten()

    # Sort in ascending order      
    rev_coef_X_Y_flat = np.sort(coef_X_Y_flat)    

    # Reverse 
    coef_X_Y_flat = rev_coef_X_Y_flat[::-1]

    print('coef_X_Y_flat   = ')     
    # print('coef_X_Y_flat   = ', coef_X_Y_flat  )     
    for x in range(5): 
        print(coef_X_Y_flat[x], sep = ", ") 

    print('rev_coef_X_Y_flat   = '  )   
    # print('rev_coef_X_Y_flat   = ', rev_coef_X_Y_flat  )   
    for x in range(5): 
        print(rev_coef_X_Y_flat[x], sep = ", ") 

    if pltshow  :
        plt.matshow(Coef_X_Y)
        plt.colorbar( shrink=0.75)
        plt.clim(-0.3, 0.3)
        # changing the rc parameters and plotting a line plot
        plt.rcParams['figure.figsize'] = [2, 2]   
        plt.savefig(data_path_save  + data_file_save)
        plt.show()

    return (Coef_X_Y)   


def pica_2d_correlate6(Corr_X, Corr_Y,  data_path_save, data_file_save, screenshow=False, pltshow=False, pltsave=False):


    Coef_X_Y = np.corrcoef ( Corr_X, Corr_Y  )

    # Reshap to one quarter.      
    ic_num = int((Coef_X_Y.shape[0])/2)
    Coef_X_Y = Coef_X_Y[:ic_num,-ic_num:]
    print('Coef_X_Y  rehape (N) x (N))', Coef_X_Y.shape )    #  (8, 8)
    # print('Coef_X_Y   = ', Coef_X_Y  )    

    # Round an array to the given number of decimals.
    Coef_X_Y = np.round(Coef_X_Y,8)

    if screenshow :
        # flatten
        coef_X_Y_flat = Coef_X_Y.flatten()

        # Sort in ascending order      
        rev_coef_X_Y_flat = np.sort(coef_X_Y_flat)    

        # Reverse 
        coef_X_Y_flat = rev_coef_X_Y_flat[::-1]

        print('coef_X_Y_flat   = ')     
        # print('coef_X_Y_flat   = ', coef_X_Y_flat  )     
        for x in range(5): 
            print(coef_X_Y_flat[x], sep = ", ") 

        print('rev_coef_X_Y_flat   = '  )   
        # print('rev_coef_X_Y_flat   = ', rev_coef_X_Y_flat  )   
        for x in range(5): 
            print(rev_coef_X_Y_flat[x], sep = ", ") 

    if pltshow  :
        plt.matshow(Coef_X_Y)
        plt.colorbar( shrink=0.75)
        plt.clim(-0.4, 0.4)
        # changing the rc parameters and plotting a line plot
        plt.rcParams['figure.figsize'] = [2, 2]           
        plt.show()

    if pltsave :
        plt.savefig(data_path_save  + data_file_save)

    return (Coef_X_Y)   

 

