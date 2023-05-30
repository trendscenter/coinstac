---
sidebar_position: 2
---

# COINSTAC Inputs

For the purposes of this document, we will assume that you've reviewed the COINSTAC Computation Development Guide and have a fundamental understanding of how to create a basic algorithm to integrate into the user interface (UI) of the COINSTAC application. In this document, we will be diving deeper into the COINSTAC Compspec file (compspec.json), which is the main way we describe our computation to the COINSTAC UI. Generally speaking, the Compspec tells COINSTAC what Docker image to use, what the expected inputs are, and how to display the resulting output. Since we've read the above Development Guide, we should know how to reference our Docker image, so let's talk about Inputs. By the end of this document, you should be able to understand how to design the UI for your computation by using the Compspec.

The Compspec document is in JSON format, and as such, our inputs will be described within the “input”: {} parameter. A basic input looks something like this:

```
{
  "input": {
    "input_id": {
      "label": "Input ID",
      "type": "string",
      "source": "member",
      "default": "foobar"
    }
  }
}

```

“input_id” is a custom key value to allow COINSTAC to keep track of things. It should be a unique string inside of “input”. Typically this should be formatted lowercase with words separated by underscores. This could be set to really anything, as long as it is a string inside double quotes. A good working example is "options_reorient_params_yaw".

“label” should be human readable as it will result in an HTML-based label for the field as displayed in the UI. The "options_reorient_params_yaw" input has the label: "z rotation about yaw in degrees[-360,360]", which is probably very helpful for someone.

“type” specifies the displayed field input.

“source” communicates whether the field should be set in the Pipeline by the owner or a member of the consortium.

“default” sets a default value.

### Additional Input Parameters

| Parameter | Notes | Example Code |
| --- | --- | --- |
| order | This parameter will specify the order in which a particular Input field will appear. It expects an integer. | "order": 20, |
| group | You create a group of fields by specifying a matching string for each input you’d like to include. | "group": "segmentation", |
| conditional | You can make certain fields visible only when another field is set to a particular value. “Variable” is the input_id of the affecting field. | "conditional": {"variable":"options_smoothing","value": true}, |
| tooltip | You can add additional text to appear under a field label to explain the purpose of the field or give guidance about expected input. This field will place a (i) icon next to the field label and will show the text when the user places their pointer over the icon | "tooltip": "Full width half maximum smoothing kernel value along x in mm", |

### Input Types

There are two basic input types: Data and Field Inputs. Data inputs are concerned with external files which vary based on the expected format/file type. Whereas Field inputs are essentially what you might expect to use when creating an HTML-based form.

### Data Inputs

There are 4 essential Data input types:

- freesurfer
- csv
- files
- directory

### Freesurfer and CSV input

The freesurfer type is typically used in conjunction with an additional csv field. The purpose is to define—for the UI Pipeline—a specific dataset as well as covariate values associated with each file. The freesurfer name is a bit of a misnomer since it is designed to handle FreeSurfer or NiFTI files. This input type will also allow the Consortium/Pipeline owner the option to specify particular “Areas of Interest” of the brain within the COINSTAC UI application.

You see the expected inputs (inputspec) here: [https://raw.githubusercontent.com/trendscenter/coinstac-ssr-fsl/master/test/inputspec.json](https://raw.githubusercontent.com/trendscenter/coinstac-ssr-fsl/master/test/inputspec.json)

The code in the Compspec looks like this:

```
{
  "data": {
    "label": "Data",
    "type": "freesurfer",
    "items": ["FreeSurfer"],
    "extensions": ["csv", "txt"],
    "source": "owner",
    "order": 1
  }
}
```

This is how the field looks in COINSTAC UI (the “Interest” field is automatically generated):

**UI Display Example**

<!-- ![ui_display_example1.png](ui_display_example1.png) -->
![/img/page-compspec/image_1.png](/img/page-compspec/image_1.png)

A freesurfer field only works if you also use it in conjunction with a csv field. Here is a typical input structure from a Compspec.

```
{
  "covariates": {
    "label": "Covariates",
    "type": "csv",
    "items": ["boolean", "number", "string"],
    "source": "member",
    "order": 0
  }
}

```

You'll need a CSV file formatted like so:

```
file,isControl,age
subject0_aseg_stats.txt,False,22.0
subject1_aseg_stats.txt,True,47.0
subject2_aseg_stats.txt,False,56.0

```

Importantly, the CSV file and the associated files should reside in the same directory folder.

The field looks like this in the UI pipeline:

**UI Display Example**

<!-- ![ui_display_example2.png](ui_display_example2.png) -->
![/img/page-compspec/image_2.png](/img/page-compspec/image_2.png)

We are telling the COINSTAC Pipeline UI what the expected covariate fields are based on the csv file header. Mind you, other member sites in a consortium might have similar but not exactly the same header formatting for their csv files. No problem. COINSTAC gives the ability to map local data columns to the expected pipeline covariates described in the fields above. Perhaps a user's column for “isControl” is labeled “control,” or “gender” is labeled “sex”. You get the idea...

![/img/page-compspec/image_3.png](/img/page-compspec/image_3.png)

The Freesurfer/CSV setup above is the most standard scenario used in COINSTAC. A good working example to review in depth is: [https://github.com/trendscenter/coinstac-ssr-fsl](https://github.com/trendscenter/coinstac-ssr-fsl). However, it is very likely that your computation is a bit different...

### Files input

There are a few computations currently in production that are not concerned with the standard Freesurfer/CSV paradigm. The developers just want either a couple of specific files identified for input, or perhaps a bunch of files that the computation will then know how to process. For this, we have the Files input.

For example, the computation [https://github.com/trendscenter/coinstac-dsne-multishot/](https://github.com/trendscenter/coinstac-dsne-multishot/) expects 2 files from each site for input.

Here is the portion of the inputspec describing what the computation expects as file input:

```
{
  "site_data": {
    "value": "test_high_dimensional_site_1_mnist_data.txt"
  },
  "site_label": {
    "value": "test_high_dimensional_site_1_mnist_label.txt"
  }
}

```

To achieve this in the UI, we've set the Compspec as follows:

```
{
  "site_data": {
    "label": "Site Data",
    "type": "files",
    "items": ["site_data"],
    "extensions": [["csv", "txt"]],
    "source": "member"
  },
  "site_label": {
    "label": "Site Label",
    "type": "files",
    "items": ["site_label"],
    "extensions": [["csv", "txt"]],
    "source": "member"
  }
}

```

This is what it looks like in the Pipeline UI:

**UI Display Example**

<!-- ![ui_display_example3.png](ui_display_example3.png) -->
![/img/page-compspec/image_4.png](/img/page-compspec/image_4.png)

...and finally this when mapping your files into the Consortium.

**UI Display Example**

<!-- ![ui_display_example4.png](ui_display_example4.png) -->
![/img/page-compspec/image_5.png](/img/page-compspec/image_5.png)

### Directory Input

So, we now know how to specify individual input files, but what if we have a bunch of files to work with? We can either use the 'files' type if we want to be able to choose the files , or the 'directory' type if we just want to bring in everything contained inside a directory. The example below is using the 'files' method, but could easily use 'directory' instead.

Another computation [https://github.com/trendscenter/coinstac-mancova](https://github.com/trendscenter/coinstac-mancova) expects the results from GICA as input. The trouble is, we're dealing with a lot of files!

![/img/page-compspec/image_6.png](/img/page-compspec/image_6.png)

Thankfully, we can handle this. Here's how the Compspec looks:

```
{
  "data": {
    "label": "Data",
    "type": "files",
    "items": ["GICA Files"],
    "extensions": [["csv", "txt", "gz", "nii"]],
    "order": 0
  }
}

```

Which translates to this in Pipeline UI:

**UI Display Example**

<!-- ![ui_display_example5.png](ui_display_example5.png) -->
![/img/page-compspec/image_7.png](/img/page-compspec/image_7.png)

...and looks like this after selecting the files upon mapping:

**UI Display Example**

<!-- ![ui_display_example6.png](ui_display_example6.png) -->
![/img/page-compspec/image_8.png](/img/page-compspec/image_8.png)

The computation is written in such a way to select the files necessary to run its algorithm.

To see that in action look here: [https://github.com/trendscenter/coinstac-mancova/blob/master/coinstac_mancova/local.py#L67](https://github.com/trendscenter/coinstac-mancova/blob/master/coinstac_mancova/local.py#L67)

### Field Inputs

COINSTAC allows the basic inputs that you might expect when using/creating an HTML form. Here’s a handy table showing an example implementation of each:

**boolean:**

```
"skip_gica": {
  "type": "boolean",
  "default": true,
  "label": "Skip Local GICA Step",
  "source": "owner"
}

```
![/img/page-compspec/image_9.png](/img/page-compspec/image_9.png)

**number:**

```
"num_ics": {
  "type": "number",
  "default": 53,
  "label": "Global Number of Independent Components",
  "source": "owner"
}

```
![/img/page-compspec/image_10.png](/img/page-compspec/image_10.png)

**string:**

```
"threshdesc": {
  "type": "string",
  "default": "none",
  "label": "Threshdesc",
  "source": "owner"
}

```
![/img/page-compspec/image_11.png](/img/page-compspec/image_11.png)

**select:**

```
"regression_file_input_type": {
  "type": "select",
  "label": "Regression file input type",
  "default": "swc1",
  "values": ["swc1", "swc2", "swc3"],
  "source": "owner"
}

```

**UI Display Example**

<!-- ![ui_display_example7.png](ui_display_example7.png) -->
![/img/page-compspec/image_12.png](/img/page-compspec/image_12.png)

### Advanced Field Inputs

Sometimes the sort of data we are trying to capture via field inputs is a little trickier. We might want users to select an integer or float within a specified Range, or they might need to be able to tweak a required preformatted JSON Object. Here are examples of each:

**range:**

```
"options_reorient_params_x_mm": {
  "type": "range",
  "label": "x translation in mm",
  "default": 5,
  "min": -50,
  "max": 50,
  "step": 5,
  "order": 6,
  "source": "owner"
}

```

![/img/page-compspec/image_13.png](/img/page-compspec/image_13.png)

**object:**

```
"results_html_path": {
  "group": "options",
  "label": "Results",
  "default": [
    {
      "title": "Univariate Regression",
      "Path": "coinstac-univariate-regression/coinstac-gica_merge_mancovan_results_summary/icatb_mancovan_results_summary.html"
    }
  ],
  "type": "object",
  "source": "owner",
  "order": 5
}

```
![/img/page-compspec/image_14.png](/img/page-compspec/image_14.png)

Hopefully, this has illuminated things for you. Feel free to reach out to the COINSTAC team via our Slack channel (#coinstac-general) if you have any questions.