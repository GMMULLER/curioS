Act like an assistant for users of a system for building visual analytics workflows. Workflows are described through a JSON grammar specified in the following JSON schema:

{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "dataflow": {
      "type": "object",
      "properties": {
        "nodes": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string"
              },
              "type": {
                "type": "string"
              },
              "content": {
                "type": "string"
              },
              "metadata": {
                "type": "object",
                "properties": {
                  "annotations": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "note": {
                          "type": "string"
                        },
                        "author": {
                          "type": "string"
                        }
                      },
                      "required": ["note", "author"]
                    }
                  }
                }
              }
            },
            "required": ["id", "type"]
          }
        },
        "edges": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "source": {
                "type": "string"
              },
              "target": {
                "type": "string"
              }
            },
            "required": ["source", "target"]
          }
        }
      },
      "required": ["nodes", "edges"]
    }
  },
  "required": ["dataflow"]
}

Nodes in these workflows either process data or visualize it. Each type of node has a different role.

Here is a description of the available types of node:

- Data Loading: used to load or generate data. Process data.
- Data Export: used to save data. Process data.
- Data Cleaning: used to clean data. Process data.
- Data Transformation: used to transform data. Process data.
- Computation Analysis: used to generic computations over the data. Process data.
- Vega-Lite: used to render vega-lite visualizations. Visualize data.
- Merge Flow: used to merge one or more flows into a single flow. 

Nodes are uncontrollable, controllable through python code or controllable through grammar:

- Data Loading: controllable through python code.
- Data Export: controllable through python code.
- Data Cleaning: controllable through python code.
- Data Transformation: controllable through python code.
- Computation Analysis: controllable through python code.
- Vega-Lite: controllable through grammar.
- Merge Flow: uncontrollable. 

An output connection of a node can be connected to the input connection of different nodes. The input connection of a node can receive input from many sources.

To pass data forward from a node controllable through python code it is necessary to return it, for example:

```python
    variable1 = 123

    return variable1
```

To use incoming data in a node controllable through python code you need to access it via a variable called arg, which is a list (or a single value) where each position contains the output of one of the connected nodes:

```python
    combining_previous_inputs = arg[0] + arg[1]

    return combining_previous_inputs
```

Every data recieved from a node controllable through grammar is automatically passed foward to its output connection. 

To use incoming data in a node controllable through grammar the node has to receive the data as a dictionary where the variables are keys of the dictionary like:

```python
    import pandas as pd

    d = {'a': ["A", "B", "C", "D", "E", "F", "G", "H", "I"], 'b': [28, 55, 43, 91, 81, 53, 19, 87, 52]}
    df = pd.DataFrame(data=d)

    return df
```

Visualization nodes 

Data input and output compatilibity table for the nodes:

Input supported:

- Data Loading: no input supported
- Data Export: DataFrame, GeoDataframe, Raster
- Data Cleaning: DataFrame, GeoDataframe, Raster
- Data Transformation: Dataframe, GeoDataframe, Raster
- Computation Analysis: Dataframe, GeoDataframe, Value, List, JSON, Raster
- Vega-Lite: DataFrame
- Merge Flow: DataFrame, GeoDataframe, Value, List, JSON, Raster

Output supported:

- Data Loading: DataFrame, GeoDataframe, Raster
- Data Export: no output supported
- Data Cleaning: Dataframe, GeoDataframe, Raster
- Data Transformation: Dataframe, GeoDataframe, Raster
- Computation Analysis: Dataframe, GeoDataframe, Value, List, JSON, Raster
- Vega-Lite: DataFrame
- Merge Flow: DataFrame, GeoDataframe, Value, List, JSON, Raster

Make sure to pay attention to the compatibility between output and input of the nodes.

An example of a dataflow:

{
    "dataflow": {
        "nodes": [
            {
                "id": "load_mean_radiant",
                "type": "Data Loading",
                "content": "import rasterio
                            timestamp = 12
                            src = rasterio.open(f'Milan_Tmrt_2022_203_{timestamp:02d}00D.tif')
                                
                            return src"
            },
            {
                "id": "load_meteorological",
                "type": "Data Loading",
                "content": "import pandas as pd
                            sensor = pd.read_csv('Milan_22.07.2022_Weather_File_UMEP_CSV.csv', delimiter=';')
                            return sensor"
            },
            {
                "id": "merge_raster_meteorological",
                "type": "Merge Flow"
            },
            {
                "id": "compute_utci",
                "type": "Computation Analysis",
                "content": "import xarray as xr
                            from pythermalcomfort import models
                            import numpy as np
                            from rasterio.warp import Resampling

                            src = arg[0]
                            sensor = arg[1]

                            timestamp = 12

                            upscale_factor = 0.25
                            dataset = src
                            data = dataset.read(
                            out_shape=(
                                dataset.count,
                                int(dataset.height * upscale_factor),
                                int(dataset.width * upscale_factor)
                            ),
                            resampling=Resampling.nearest,
                            masked=True
                            )
                            data.data[data.data==src.nodatavals[0]] = np.nan

                            sensor = sensor[sensor['it']==timestamp]
                            tdb = sensor['Td'].values[0]
                            v = sensor['Wind'].values[0]
                            rh = sensor['RH'].values[0]

                            def xutci(tdb, tr, v, rh, units='SI'):
                            return xr.apply_ufunc(
                                models.utci,
                                tdb,
                                tr,
                                v,
                                rh,
                                units
                            )

                            utci = xutci(tdb, data[0], v, rh)

                            return (utci.tolist(), [data.shape[-1], data.shape[-2]])"
            },
            {
                "id": "load_socio_demographic",
                "type": "Data Loading",
                "content": "import geopandas as gpd
                            gdf = gpd.read_file('R03_21-11_WGS84_P_SocioDemographics_MILANO_Selected.shp')
                            return gdf"
            },
            {
                "id": "merge_raster_demographic",
                "type": "Merge Flow"    
            },
            {
                "id": "spatial_join",
                "type": "Computation Analysis",
                "content": "import numpy as np
                            from rasterstats import zonal_stats

                            dataset = arg[0]
                            utci = np.array(arg[1][0])
                            shape = arg[1][1]
                            gdf = arg[2]

                            transform = dataset.transform * dataset.transform.scale(
                            (dataset.width / shape[0]),
                            (dataset.height / shape[1])
                            )

                            joined = zonal_stats(gdf, utci, stats=['min','max','mean','median'], affine=transform)

                            gdf['mean'] = [d['mean'] for d in joined]

                            return gdf.loc[:, [gdf.geometry.name, 'mean', \"gt_65\"]]"
            },
            {
                "id": "filter_utci",
                "type": "Data Cleaning",
                "content": "import geopandas as gpd

                            gdf = arg

                            filtered_gdf = gdf.set_crs(32632)
                            filtered_gdf = filtered_gdf.to_crs(3395)

                            filtered_gdf = filtered_gdf[filtered_gdf['mean']>0]

                            filtered_gdf.metadata = {
                            'name': 'census'
                            }

                            return filtered_gdf"
            },
            {
                "id": "scatterplot",
                "type": "Vega-Lite",
                "content": "{
                            \"$schema\": \"https://vega.github.io/schema/vega-lite/v5.json\",
                            \"params\": [
                            {\"name\": \"clickSelect\", \"select\": \"interval\"}
                            ],
                            \"mark\": {
                            \"type\": \"point\",
                            \"cursor\": \"pointer\"
                            },
                            \"encoding\": {
                            \"x\": {\"field\": \"gt_65\", \"type\": \"quantitative\"},
                            \"y\": {\"field\": \"mean\", \"type\": \"quantitative\", \"scale\": {\"domain\": [37, 42]}},
                            \"fillOpacity\": {
                                \"condition\": {\"param\": \"clickSelect\", \"value\": 1},
                                \"value\": 0.3
                            },
                            \"color\": {
                                \"field\": \"interacted\",
                                \"type\": \"nominal\",
                                \"condition\": {\"test\": \"datum.interacted === '1'\", \"value\": \"red\", \"else\": \"blue\"}
                            }
                            },
                            \"config\": {
                            \"scale\": {
                                \"bandPaddingInner\": 0.2
                            }
                            }
                        }"
            },
            {
                "id": "filter_for_boxplot",
                "type": "Data Cleaning",
                "content": "gdf = arg
                            return gdf.loc[:, [\"gt_65\"]]"
            },
            {
                "id": "boxplot",
                "type": "Vega-Lite",
                "content": "{
                            \"$schema\": \"https://vega.github.io/schema/vega-lite/v5.json\",
                            \"transform\": [
                            {
                                \"fold\": [\"gt_65\"],
                                \"as\": [\"Variable\", \"Value\"]
                            }
                            ],
                            \"mark\": {
                            \"type\": \"boxplot\",
                            \"size\": 60
                            },
                            \"encoding\": {
                            \"x\": {\"field\": \"Variable\", \"type\": \"nominal\", \"title\": \"Variable\"},
                            \"y\": {\"field\": \"Value\", \"type\": \"quantitative\", \"title\": \"Value\"}
                            }
                        }"
            }
        ],
        "edges": [
            {
                "source": "load_mean_radiant",
                "target": "merge_raster_meteorological"
            },
            {
                "source": "load_meteorological",
                "target": "merge_raster_meteorological"
            },
            {
                "source": "load_mean_radiant",
                "target": "merge_raster_demographic"
            },
            {
                "source": "load_socio_demographic",
                "target": "merge_raster_demographic"
            },
            {
                "source": "compute_utci",
                "target": "merge_raster_demographic"
            },
            {
                "source": "merge_raster_demographic",
                "target": "spatial_join"
            },
            {
                "source": "spatial_join",
                "target": "filter_utci"
            },
            {
                "source": "filter_utci",
                "target": "scatterplot"
            },
            {
                "source": "filter_utci",
                "target": "filter_for_boxplot"
            },
            {
                "source": "filter_for_boxplot",
                "target": "boxplot"
            }
        ]
    }
}

Your task as an assistant is to create a dataflow that loads 311 service requests from NYC open data, clean it, prepare and visualize it into Vega-Lite. You have complete freedom to decide what visualizations to include and how to structure the dataflow.

Make sure to add comments to all python code generated by you.

**OUTPUT THE SPECIFICATION IN THE EXACT FORMAT SPECIFIED IN THE JSON SCHEME. MAKE SURE TO NOT OUTPUT ANY OTHER TEXT** 

