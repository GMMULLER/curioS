Title: Analyzing crime distribution in Manhattan with multiple datasets (?)

Dataset: https://github.com/urban-toolkit/utk/blob/master/docs/examples/1-data.md

This use case focuses on loading multiple urban datasets for Manhattan and aggregate over zip code. There should be one UTK plot and one Vega Plot. 

**Intention**: Definition.

**Features used**: 

- LLM-assisted Task definition chat
- Generate dataflow suggestions from LLM
- Accept or reject LLM suggestions node by node
- LLM-assisted warnings
- Subtasks sugestions from LLM
- User can define expected input and output of each node

Should I give less details to the LLM in the Task definition?
Complete the content of the nodes manually?
Edit task manually?

### Defining Task with LLM

Try #1 (I kinda know what I want):

Me: I want to aggregate and visualize multiple datasets considering the ZIP code boundaries of Manhattan (NYC). I have these datasets available: Crime, Food, Noise, Parks, School, Sky, Subway, and Taxi.

LLM: Now let's define how you will be loading these datasets. How do you plan to get the data into the dataflow? Will you load them from local files, download them from the internet, or do you have another method in mind? Additionally, could you specify the format of these datasets (e.g., CSV, GeoJSON, etc.)?

Me: I wil use local CSV files, I have one for each dataset. But I dont know where to get the data for ZIP code.

LLM: You can often obtain ZIP code boundary data from public sources or APIs that provide geographic information, such as the U.S. Census Bureau or local government GIS services. Alternatively, you can find GeoJSON files online that specifically contain ZIP code boundaries for Manhattan. Would you like to proceed with using a local file for ZIP code boundaries, or would you prefer to search for GeoJSON data online?

Me: We can use a local file.

LLM: Now let's define the type of analysis you plan to perform with these datasets. What specific aggregations or calculations do you want to achieve using the Crime, Food, Noise, Parks, School, Sky, Subway, and Taxi datasets?

Me: I want to have the number of occurrences per ZIP code

LLM: Now let's determine how you would like to visualize this aggregated data. Would you prefer to use 2D visualizations (like charts) or 3D visualizations (like maps) for displaying the occurrences per ZIP code?

Me: I want one map with the aggregated datasets by ZIP code and another 2D plot that I can have some multidimensional representation of each ZIP code.

LLM: To clarify, you want one 3D map visualization utilizing the aggregated datasets by ZIP code and a second 2D plot for a multidimensional representation, which could summarize or compare certain metrics across ZIP codes. For the 2D plot, which specific attributes or metrics would you like to visualize? This could include aggregated occurrences, averages, or specific comparisons among the datasets.

Me: Just to confirm, you'll have one 3D map visualization using UTK that displays the aggregated occurrences of Crime, Food, Noise, Parks, School, Sky, Subway, and Taxi datasets by ZIP code. Additionally, you'll have a 2D plot using Vega-Lite that also represents the same aggregated occurrences by ZIP code.

Let's summarize your task and the flow of the data: Load the Crime, Food, Noise, Parks, School, Sky, Subway, and Taxi datasets from local CSV files; load the ZIP code boundaries from a local shapefile; aggregate the number of occurrences for each dataset by ZIP code; create a 3D map visualization of the aggregated data using UTK; and create a 2D plot to represent the same aggregation using Vega-Lite.

Here's the task summarized:

Task: **Load the Crime, Food, Noise, Parks, School, Sky, Subway, and Taxi datasets from local CSV files; load the ZIP code boundaries from a local shapefile; aggregate the number of occurrences for each dataset by ZIP code; create a 3D map visualization of the aggregated data using UTK; and create a 2D plot to represent the same aggregation using Vega-Lite.** If you would like to change it let me know!

--------------------------------------------------------

- Using a Task with less number of datasets:

**Load the Crime, School, and Taxi datasets from local CSV files; load the ZIP code boundaries from a local shapefile; aggregate the number of occurrences for each dataset by ZIP code; create a 3D map visualization of the aggregated data using UTK; and create a 2D plot to represent the same aggregation using Vega-Lite.**