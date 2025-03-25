
### Interactions with the LLM

**Directly editing task:**

Me: I want to load three crowdsourced Sidewalk datasets 'access_attributes' as CSV, 'access_score_neighborhood' as GeoJSON, and 'access_score_streets' as GeoJSON. After I want to clean each dataset and only maintain important attributes for my analysis. Then, since this is a crowdsource dataset I want to calculate an uncertainty score based on the 'access_attributes' using the values of 'agree', 'disagree' and 'unsure'. For 'access_score_neighborhood' I want to calculate an accesibility score using 'avg_attribute_count' that has the sub atributes 'CurbRamp', 'NoCurbRamp', 'Obstacle', 'SurfaceProblem'. Then I want to visualize the neighborhoods in a UTK map and have interactions linked to a Vega-Lite barchart that has 'neighborhood_name' in the x axis and 'accessbility' on the y. This UTK with accessibility and Vega should be linked by interaction, so when you hover over the barchart the neighborhood light up. Then I want to aggregate the uncertainty score of 'access_attributes' by neighborhood and also show that on a map. Finally, use the 'access_score_streets' data to calculate accessibility score using 'avg_attribute_count' that has the sub atributes 'CurbRamp', 'NoCurbRamp', 'Obstacle', 'SurfaceProblem' and visualize it using UTK. Additionally group 'access_attributes' uncertainty by street and show it on a UTK map.

**Interacting with chat to define task**

Resulting Task: 

You will load three datasets: 'access_attributes' from a local CSV file, and both 'access_score_neighborhood' and 'access_score_streets' from local GeoJSON files. You will compute an accessibility score based on attribute counts and an uncertainty score based on user agreement. For visualizations, you will generate four map-based visualizations: two for accessibility (neighborhood and street) and two for uncertainty (neighborhood and street). Additionally, you will create a plot showing accessibility by neighborhood that is linked with interactions to the map visualizations, enabling dynamic exploration of the data.

Further manually editing the task:

You will load three datasets: 'access_attributes' from a local CSV file, and both 'access_score_neighborhood' and 'access_score_streets' from local GeoJSON files. After clean and filter relevelant attributes. You will compute an accessibility score based on attribute counts and an uncertainty score based on user agreement. For visualizations, you will generate four map-based visualizations: two for accessibility (neighborhood and street) and two for uncertainty (neighborhood and street). Additionally, you will create a plot showing accessibility by neighborhood that is linked with interactions to the accessibility map visualization, enabling dynamic exploration of the data.