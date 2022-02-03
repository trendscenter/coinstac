'''
Decentralized Parallel ICA (“dpICA”) : COINSTAC simulator
This script computes pICA using the INFOMAX criteria in decentralized environment.
Creator : Chan Panichvatana (cpanichvatana1@student.gsu.edu)
Reference: Parallel Independent Component Analysis (pICA): (Liu et al. 2009)
'''

import numpy as np
import matplotlib.pyplot as plt
import math
import os

sep = os.sep

def ica_fuse_corr( x, y):  # x (48,8) y (48,8)

    # Linear or rank correlation

    if not ('y' in locals() ):
        y = x
        [ny1, ny2] = y.shape     
    else :
        ny2 = y.shape[1] 
    
    # Check dimensions of x and y
    if (x.shape[0] != y.shape[0] ) :
        a = 1
        # print('X and Y must have the same number of rows.')
    #end

    [nx1, nx2] = x.shape    

    # Initialise pairwise correlation
    c = np.zeros((nx2, ny2))    

    for ii in range(0,nx2):     
        for jj in range(0,ny2):     
            x_ii = x[:, ii]
            y_jj = y[:, jj]
            c[ii, jj] = ica_fuse_corr2(x[:, ii], y[:, jj]) # Find corr each colume
    # End loop over rows

    return c

def ica_fuse_corr2(x, y): 
    # computes correlation coefficient
    meanX = np.mean(x)      
    meanY = np.mean(y)      

    # Remove mean
    x = x - meanX       
    y = y - meanY       

    corr_coeff = np.sum(np.sum(x*y, axis=0)) / math.sqrt(np.sum(np.sum(x*x)) * np.sum(np.sum(y*y)))

    return corr_coeff   

def pica_2d_correlate6(Corr_X, Corr_Y,  data_path_save, data_file_save, screenshow=False, pltshow=False, pltsave=False):

    Coef_X_Y = np.corrcoef( Corr_X, Corr_Y  )

    # Reshap to one quarter.      
    ic_num = int((Coef_X_Y.shape[0])/2)
    Coef_X_Y = Coef_X_Y[:ic_num,-ic_num:]

    # Round an array to the given number of decimals.
    Coef_X_Y = np.round(Coef_X_Y,8)

    if screenshow :
        # flatten
        coef_X_Y_flat = Coef_X_Y.flatten()

        # Sort in ascending order      
        rev_coef_X_Y_flat = np.sort(coef_X_Y_flat)    

        # Reverse 
        coef_X_Y_flat = rev_coef_X_Y_flat[::-1]

        # print('coef_X_Y_flat   = ')
        # print('coef_X_Y_flat   = ', coef_X_Y_flat  )
        # for x in range(5):
        #     print(coef_X_Y_flat[x], sep = ", ")

        # print('rev_coef_X_Y_flat   = '  )
        # print('rev_coef_X_Y_flat   = ', rev_coef_X_Y_flat  )
        # for x in range(5):
        #     print(rev_coef_X_Y_flat[x], sep = ", ")

    if pltshow  :
        plt.matshow(Coef_X_Y)
        plt.colorbar( shrink=0.75)
        plt.clim(-0.4, 0.4)
        # changing the rc parameters and plotting a line plot
        plt.rcParams['figure.figsize'] = [2, 2]           
        plt.show()

    if pltsave :
        plt.savefig(data_path_save + os.sep + data_file_save)

    return (Coef_X_Y)   

def pica_2d_correlate7(Corr_X, Corr_Y,  data_path_save, data_file_save, screenshow=False, pltshow=False, pltsave=False):

    Coef_X_Y = np.corrcoef ( Corr_X, Corr_Y  )

    # Reshap to one quarter.      
    ic_num = int((Coef_X_Y.shape[0])/2)
    Coef_X_Y = Coef_X_Y[:ic_num,-ic_num:]
    # print('Coef_X_Y  rehape (N) x (N))', Coef_X_Y.shape )    #  (8, 8)
    # print('Coef_X_Y   = ', Coef_X_Y  )    

    # Round an array to the given number of decimals.
    Coef_X_Y = np.round(Coef_X_Y,10)

    if screenshow :
        # flatten
        coef_X_Y_flat = Coef_X_Y.flatten()

        # Sort in ascending order      
        rev_coef_X_Y_flat = np.sort(coef_X_Y_flat)    

        # Reverse 
        coef_X_Y_flat = rev_coef_X_Y_flat[::-1]

        # print('coef_X_Y_flat   = ')
        # print('coef_X_Y_flat   = ', coef_X_Y_flat  )     
        # for x in range(5):
        #     print(coef_X_Y_flat[x], sep = ", ")

        # print('rev_coef_X_Y_flat   = '  )
        # print('rev_coef_X_Y_flat   = ', rev_coef_X_Y_flat  )   
        # for x in range(5):
        #     print(rev_coef_X_Y_flat[x], sep = ", ")

    if pltshow  :
        plt.matshow(Coef_X_Y)
        plt.colorbar( shrink=0.75)
        # plt.clim(-0.4, 0.4)
        # changing the rc parameters and plotting a line plot
        plt.rcParams['figure.figsize'] = [2, 2]           
        plt.show()

    if pltsave :
        plt.savefig(data_path_save  + os.sep + data_file_save)

    return (Coef_X_Y)  


