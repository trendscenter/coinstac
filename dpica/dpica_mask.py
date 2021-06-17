'''
Reference: Parallel Independent Component Analysis (pICA): (Liu et al. 2009)

Code deverloper : cpanichvatana1@student.gsu.edu
Version : 4.0 on 6/17/2021

'''
#######################################################
# This function is to create mark from nero-images.
# Ouput file is in NIFTI (nii) format.
# Researcher: Mart Panichvatana


########################################################
# This section is to call nibabel
# https://nipy.org/nibabel/gettingstarted.html
# Use nii image file from FITv2.0e in TReNDs.
import os
from os.path import dirname, join as pjoin
import nibabel as nib
from nibabel.testing import data_path
import numpy as np
from numpy import loadtxt
import matplotlib.pyplot as plt
import scipy.io as sio
import re
from io import StringIO
import csv

# MASK_FILE_Name = 'mask_fmri_pica.nii.gz'
# MASK_FILE_Name = 'mask_fmri_pica_v3.nii.gz'
MASK_FILE_Name = "ABCD_mask_fmri_dpica_v1.nii.gz"


def pica_mask_creation3(data_path_input, mask_path_input, b_plot_mask=False, b_plot_nii=False):

    # Define input and output directory path
    data_path = data_path_input
    mask_path = mask_path_input

    # Define brain-image dimention using one example image file.
    x_size = 0
    y_size = 0
    z_size = 0
    folder1 = os.listdir(data_path)
    # fmri_file = "con_0008.img"
    # fmri_path_file =  data_path + fmri_file
    fmri_all = []
    fmri_1d_all = []
    fmri_subject_all = []

    for subject_folders in folder1:
            fmri_subject_all.append(subject_folders)             
            baseline_folders = os.listdir(data_path_input + "//" + subject_folders  + "//Baseline")
            # for fmri_folders in baseline_folders:
            anat_found = False
            for anat_folders in baseline_folders:
                if anat_folders[:6] == "anat_2" and not(anat_found) :
                    nii_folders = os.listdir(data_path_input + "//" + subject_folders + "//Baseline" \
                        "//" + anat_folders)
                    anat_found = True
            if not anat_found :
                print("Please check ANAT folders!!!!!!!!!!!")
            else :
                for img_file in nii_folders:
                    if img_file == "Sm6mwc1pT1.nii":
                        fmri_all = nib.load(data_path_input + "//" + subject_folders + "//Baseline" \
                            "//" + anat_folders + "//"  + img_file).get_fdata()   
                        first_vol = fmri_all[:, :, :] 
                        x_size, y_size, z_size = first_vol.shape
                        break    
                break
            break


    fmri_all = []
    fmri_1d_all = []
    fmri_subject_all = []
    mask_ind = []
    first_img_file = True

    for subject_folders in folder1:
            fmri_subject_all.append(subject_folders)             
            baseline_folders = os.listdir(data_path_input + "//" + subject_folders  + "//Baseline")
            # for fmri_folders in baseline_folders:
            anat_found = False
            for anat_folders in baseline_folders:
                # anat_found = False
                if anat_folders[:6] == "anat_2" and not(anat_found) :
                    nii_folders = os.listdir(data_path_input + "//" + subject_folders + "//Baseline" \
                        "//" + anat_folders)
                    anat_found = True
                    break
            if not anat_found :
                print("Please check ANAT folders!!!!!!!!!!!")
            else :
                for img_file in nii_folders:
                    if img_file == "Sm6mwc1pT1.nii":
                        # print("img_file = ", data_path_input + "//" + subject_folders + \
                        #     "//" + fmri_folders + "//" + img_file )
                        data = nib.load(data_path_input + "//" + subject_folders + "//Baseline" \
                            "//" + anat_folders + "//"  + img_file).get_fdata()   

                        data_3d_reshape = data.reshape(x_size, y_size, z_size)  
                        data_1d_reshape = data.reshape(x_size*y_size*z_size) 

                        print (" np.count_nonzero(data_1d_reshape)  = ", np.count_nonzero(data_1d_reshape)   )  
                        print (" np.sum(np.isnan(data_1d_reshape) )  = ",  np.sum(np.isnan(data_1d_reshape)) ) 

                        fmri_all.append(data_3d_reshape)    
                        fmri_1d_all.append(data_1d_reshape)

                        temp = data_1d_reshape
                        print (" np.count_nonzero(temp)  = ", np.count_nonzero(temp)   ) 

                        if first_img_file :
                            mask_ind = temp
                            first_img_file = False                             
                        else   :
                            mask_ind = np.logical_and(mask_ind,temp)  

    # Check and define number of files
    fmri_1d_all_len = len(fmri_1d_all)
    fmri_1d_all = np.asarray(fmri_1d_all)
    print("fmri_1d_all.shape = ", fmri_1d_all.shape)  

    mask_ind = np.asarray(mask_ind)
    print("mask_ind.shape = ", mask_ind.shape)      
    print("mask_ind nonzero count =" , np.count_nonzero(mask_ind))   

    # Creating mask=1 based on xx% of Nan condition
    # Higher percent = less mask (less gray)
    print("Masking at  0 of Nan  ")
    mask_ind = np.where(mask_ind == 0, 0, 1)

    # Convert mask from 1D to 3D
    fmri_3d_mask = mask_ind.reshape(x_size, y_size, z_size)
    print("fmri_3d_mask.shape = ", fmri_3d_mask.shape)                      
    print("fmri_3d_mask isnan count =" , np.count_nonzero(fmri_3d_mask))   

    # Save 3D mask file to local path
    fmri_3d_mask_saved = nib.Nifti1Image(fmri_3d_mask, np.eye(4))
    mask_fmri_pica_filename = MASK_FILE_Name
    mask_fmri_pica_filename_path = os.path.join(mask_path, mask_fmri_pica_filename)
    if os.path.exists(mask_fmri_pica_filename_path):
            os.remove(mask_fmri_pica_filename_path)
    nib.save(fmri_3d_mask_saved, mask_fmri_pica_filename_path)  
    print("Saving 2122945==>705142 mask file. ")


    ########################################################
    # Plot Mask file in black/white 

    b_plot_mask = True
    if b_plot_mask :
        # Define Plot subgraph
        slice_display_number = 4

        # Convert mask array to an unsigned byte
        mask_uint8 = fmri_3d_mask.astype(np.uint8)  
        mask_uint8*=255
        # print("mask_uint8.shape = ", mask_uint8.shape)


        fig, ax = plt.subplots(1, slice_display_number, figsize=[15, 2])

        n = 0
        slice = 0
        for _ in range(slice_display_number):
            ax[n].imshow(mask_uint8[:, :, slice], 'gray')
            ax[n].set_title('Slice number: {}'.format(slice), color='black')
            if n == 0:
                ax[n].set_ylabel('Mask image (fmri_3d_mask)', fontsize=25, color='black')
            n += 1
            slice += 10

        fig.subplots_adjust(wspace=0, hspace=0)
        plt.show()


    ########################################################
    # Plot brain images on screen 

    # b_plot_nii = True
    if b_plot_nii :
        for img, subject in zip(fmri_all, fmri_subject_all) : 
            fig, ax = plt.subplots(1, slice_display_number, figsize=[15, 2])

            n = 0
            slice = 0
            for _ in range(slice_display_number):
                ax[n].imshow(img[:, :, slice], 'gray')
                ax[n].set_title('Slice number: {}'.format(slice), color='r')
                if n == 0:
                    ax[n].set_ylabel(subject, fontsize=25, color='b')
                n += 1
                slice += 10
                

            fig.subplots_adjust(wspace=0, hspace=0)
            plt.show()

    # Return
    output_mask_file_location = mask_path + MASK_FILE_Name
    return (output_mask_file_location, x_size, y_size, z_size)

def pica_masked_Modality_X_creation4(NCOM_X_input, data_path_input, data_site_path, data_sites, mask_file_location_input, \
    x_size, y_size, z_size):

    # Setup
    #       - Import fMRI file to numpy array. Automatically masking the file.
    # Input 
    #       - NCOM : Number of component
    #       - data_path_input : Path of fMRI data
    #       - mask_file_location_input : Path of Masked file.
    # Output : 
    #       - fmri_1d_masked_all, fmri_1d_mat_masked_all, fmri_1d_masked_all.shape[0], fmri_1d_masked_all.shape[1], NCOM_X_ouput)


    # Loading masked data
    mask_data = nib.load(mask_file_location_input).get_fdata()  #  53x63x46 

    print("mask_data.shape = ", mask_data.shape )   #  (121, 145, 121)
    # print("mask_data = ", mask_data)
    print("mask_data count_nonzero =" , np.count_nonzero(mask_data))    #   1158864
    print("mask_data")




    ########################################################
    # Pull site list from file
    # Data_sites_X = pica_import_subject_to_array( data_path_input, data_sites,) 
    Data_sites_X = pica_import_subject_to_array( data_site_path, data_sites,) 

    ########################################################
    # Loop all folders to collect ".img" file into fmri_all
    # to collect all nii file names.

    folder1 = os.listdir(data_path_input)
    fmri_all = []
    fmri_1d_all = []
    fmri_1d_masked_all = []
    fmri_folder_file_name = []
    fmri_subject_all = []
    


    # for subject_folders in folder1:
    for subject_folders in Data_sites_X:

            fmri_subject_all.append(subject_folders)             
            baseline_folders = os.listdir(data_path_input + "//" + subject_folders  + "//Baseline")
            # for fmri_folders in baseline_folders:
            anat_found = False
            for anat_folders in baseline_folders:
                if anat_folders[:6] == "anat_2" and not(anat_found) :
                    nii_folders = os.listdir(data_path_input + "//" + subject_folders + "//Baseline" \
                        "//" + anat_folders)
                    anat_found = True
                    break

            if not anat_found :
                print("Please check ANAT folders!!!!!!!!!!!")
            else :
                for img_file in nii_folders:
                    if img_file == "Sm6mwc1pT1.nii":

                        current_folder_file_name = data_path_input + "//" + subject_folders + "//Baseline" \
                            "//" + anat_folders + "//"  + img_file
                        data = nib.load(current_folder_file_name).get_fdata()     # (121, 145, 121)

                        # Masking data
                        data_masked = data[mask_data > 0]  
                        data = data[mask_data.T > 0] 

                        fmri_1d_masked_all.append(data_masked)
                        fmri_folder_file_name.append(subject_folders)


    # Check and define number of files
    fmri_1d_masked_all = np.asarray(fmri_1d_masked_all)
    fmri_folder_file_name = np.asarray(fmri_folder_file_name)
    print("fmri_1d_masked_all.shape = ", fmri_1d_masked_all.shape)
    print("fmri_folder_file_name.shape = ", fmri_folder_file_name.shape)


    ########################################################
    # Component Estimation
    # Akaike information criterion
    # https://en.wikipedia.org/wiki/Akaike_information_criterion 
    # Minimum description length
    # https://en.wikipedia.org/wiki/Minimum_description_length
    
    NCOM_X_ouput = NCOM_X_input      # Default
    
    ########################################################

    return (fmri_1d_masked_all, fmri_folder_file_name, fmri_1d_masked_all.shape[0], fmri_1d_masked_all.shape[1], NCOM_X_ouput)                


def pica_Modality_Y_creation2(NCOM_Y_input, data_path_input, snp_file_name, \
    subject_data_X1, x_size, y_size):


    fname = os.path.join(data_path_input, snp_file_name)

    snp_1d_all = []
    i = 0

    for subject_name in subject_data_X1:
        # print (subject_name)

        IID_text = "(.*)" + subject_name[4:] + "(.*)"
        print (subject_name , "  ==> ", IID_text )
        i = i + 1
        j = 0 
        
        snp_read_file = open(fname, "r")
        for line in snp_read_file:
            j = j+1

            if re.match(IID_text, line):
                # print (line)
                # snp_1d_all.append(line)
                sting_temp  = StringIO(line)
                snp_temp = np.genfromtxt(sting_temp)        # (388901,)



                # Remove Nan to 0
                snp_temp_num = np.nan_to_num(snp_temp)




                snp_temp_num_non_id = np.delete(snp_temp_num,[0,1,2,3,4,5])

  

                # Append new snp record to Modality Y.
                snp_1d_all.append(snp_temp_num_non_id)


                break
        snp_read_file.close()
    print(' Break ')




    # Check and define number of files
    snp_1d_all = np.asarray(snp_1d_all)
    print("snp_1d_all.shape = ", snp_1d_all.shape)   # shape:(2, 388901)

    ########################################################
    # Component Estimation
    # Akaike information criterion
    # https://en.wikipedia.org/wiki/Akaike_information_criterion 
    # Minimum description length
    # https://en.wikipedia.org/wiki/Minimum_description_length

    NCOM_Y_output = NCOM_Y_input     # Default
    

    return (snp_1d_all, snp_1d_all.shape[0], snp_1d_all.shape[1], NCOM_Y_output)   


def pica_Modality_X_creation_from_file1(NCOM_X_input, data_path_input, fmri_file_name, \
    x_size, y_size):

    fmri_1d_all = []

    fmri_1d_all = pica_import_csv_to_array(data_path_input, fmri_file_name) 

    print("fmri_1d_all.shape = ", fmri_1d_all.shape)   

    NCOM_X_output = NCOM_X_input     

    return (fmri_1d_all, fmri_1d_all.shape[0], fmri_1d_all.shape[1], NCOM_X_output)   


def pica_Modality_Y_creation_from_file1(NCOM_Y_input, data_path_input, snp_file_name, \
    x_size, y_size):

    snp_1d_all = []
    i = 0

    snp_1d_all = pica_import_csv_to_array(data_path_input, snp_file_name) 


    # snp_1d_all = np.asarray(snp_1d_all)
    print("snp_1d_all.shape = ", snp_1d_all.shape)  

    NCOM_Y_output = NCOM_Y_input     # Default

    return (snp_1d_all, snp_1d_all.shape[0], snp_1d_all.shape[1], NCOM_Y_output)   


def pica_import_data_to_array(data_path_input, file_name_input) :

    file_name = os.path.join(data_path_input, file_name_input)

    array_1d_output = []
    array_1d_output.append(np.genfromtxt(file_name, dtype=float ))

    array_1d_output = np.asarray(array_1d_output)
    array_1d_output = np.squeeze(array_1d_output, 0)
    print("array_1d_output.shape = ", array_1d_output.shape)


    return (array_1d_output)   


def pica_import_csv_to_array(data_path_input, file_name_input) :
   

    file_name = os.path.join(data_path_input, file_name_input)

    array_1d_output = []
    with open(file_name, newline='') as csvfile:
        array_1d_output = list(csv.reader(csvfile))

    array_1d_output = np.asarray(array_1d_output, dtype=float)

    print("array_1d_output.shape = ", array_1d_output.shape)

    return (array_1d_output)   


def pica_import_subject_to_array(data_path_input, file_name_input) :
    file_name = os.path.join(data_path_input, file_name_input)
    array_1d_output = []
    array_1d_output = np.loadtxt(file_name, dtype=str, comments="#", delimiter=",", unpack=False)
    return (array_1d_output)   
