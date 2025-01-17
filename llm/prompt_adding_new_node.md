Act like an assitant for users of a system for building visual analytics workflows. Workflows are described through a JSON grammar specified in the following JSON schema:

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
              }
            },
            "required": ["id", "type", "content"]
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

Nodes are uncontrollable, controllable through python code or controllable through grammar:

- Data Loading: controllable through python code.
- Data Export: controllable through python code.
- Data Cleaning: controllable through python code.
- Data Transformation: controllable through python code.
- Computation Analysis: controllable through python code.
- Vega-Lite: controllable through grammar.

An output connection of a node can be connected to the input connection of different nodes. The input connection of a node can receive input from many sources.

To pass data forward from a node controllable through python code it is necessary to return it, for example:

```python
    variable1 = 123

    return variable1
```

To use incoming data in a node controllable through python code you need to access it via a variable called args, which is a list where each position contains the output of one of the connected nodes:

```python
    combining_previous_inputs = args[0] + args[1]

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

Output supported:

- Data Loading: DataFrame, GeoDataframe, Raster
- Data Export: no output supported
- Data Cleaning: Dataframe, GeoDataframe, Raster
- Data Transformation: Dataframe, GeoDataframe, Raster
- Computation Analysis: Dataframe, GeoDataframe, Value, List, JSON, Raster
- Vega-Lite: DataFrame

Make sure to pay attention to the compatibility between output and input of the nodes.

Your task as an assistant is to modify the following specification to include a new node (do not remove any old node or edge) using Vega-Lite to visualize the data as a scatter plot:

{
    "dataflow": {
        "nodes": [
            {
                "id": "node1",
                "type": "Computation Analysis",
                "content": "import pandas as pd
                            d = {'a': [\"A\", \"B\", \"C\", \"D\", \"E\", \"F\", \"G\", \"H\", \"I\"], 'b': [28, 55, 43, 91, 81, 53, 19, 87, 52]}
                            df = pd.DataFrame(data=d)
                            return df"
            },
            {
                "id": "node2",
                "type": "Vega-Lite",
                "content": "{
                    \"$schema\": \"https://vega.github.io/schema/vega-lite/v5.json\",
                    \"description\": \"A simple bar chart with embedded data.\",
                    \"mark\": \"bar\",
                    \"encoding\": {
                        \"x\": {\"field\": \"a\", \"type\": \"nominal\", \"axis\": {\"labelAngle\": 0}},
                        \"y\": {\"field\": \"b\", \"type\": \"quantitative\"}
                    }
                }"
            }
        ],
        "edges": [
            {
                "source": "node1",
                "target": "node2"
            }
        ]
    }
}

**OUTPUT THE SPECIFICATION IN THE EXACT FORMAT SPECIFIED IN THE JSON SCHEME"
