import warnings
warnings.filterwarnings('ignore')
import rasterio
import geopandas as gpd
import pandas as pd
import json
def userCode(arg):
	import pandas as pd
	import geopandas as gpd
	from shapely.geometry import Point
	
	df_points = arg
	
	df_points = df_points.explode("latLng", ignore_index=True)
	
	df_points["geometry"] = df_points["latLng"].apply(lambda x: Point(x[1], x[0]))  # (lon, lat)
	
	gdf_points = gpd.GeoDataFrame(df_points, geometry="geometry", crs="EPSG:4326")
	
	gdf_points = gdf_points.drop(columns=["latLng"])
	
	gdf_points = gdf_points.to_crs(3857)
	
	gdf_points["geometry"] = gdf_points["geometry"].buffer(50)
	
	gdf_points["value"] = 1
	
	gdf_points['linked'] = gdf_points.index.to_series().apply(lambda x: [x])
	
	gdf_points = gdf_points[["geometry", "value", "linked"]]
	
	gdf_points = gdf_points.to_crs(3395)
	
	gdf_points.metadata = {
	    'name': 'pulse'
	}
	
	return gdf_points
boxType = 'DATA_TRANSFORMATION'
def dumpsInput(input):
	if input['dataType'] == 'outputs':
		for key,elem in enumerate(input['data']):
			input['data'][key] = dumpsInput(elem)
		return json.dumps(input)
	else:
		return json.dumps(input)
input = {"data": "{\"latLng\": {\"0\": [[40.779187935, -73.963938144], [40.779187935, -73.963346048]], \"1\": [[40.747766667, -73.985845704], [40.748215542, -73.986437801], [40.748215542, -73.985845704]], \"2\": [[40.758539673, -73.979332646], [40.758539673, -73.97874055], [40.758988548, -73.980516838], [40.758988548, -73.979924742], [40.758988548, -73.979332646], [40.758988548, -73.97874055]], \"3\": [[40.757193047, -73.986437801], [40.757641922, -73.986437801], [40.755846421, -73.987029897], [40.758090798, -73.985845704], [40.756295297, -73.987029897], [40.756744172, -73.986437801]], \"4\": [[40.714101022, -74.006569072], [40.714549898, -74.007753265], [40.714549898, -74.007161168], [40.714101022, -74.007161168]], \"5\": [[40.757193047, -74.003016495], [40.757193047, -74.002424399], [40.757641922, -74.003016495], [40.758090798, -74.003016495]], \"6\": [[40.708714519, -74.011897938], [40.709163395, -74.011897938], [40.709163395, -74.011305842], [40.70961227, -74.011897938], [40.70961227, -74.011305842]], \"7\": [[40.78053456, -73.97400378], [40.78053456, -73.973411684], [40.780983436, -73.97400378]], \"8\": [[40.752255419, -73.977556357], [40.752704294, -73.978148454], [40.752704294, -73.977556357]], \"9\": [[40.750459918, -73.994135052]], \"10\": [[40.760784049, -73.977556357], [40.760784049, -73.976964261], [40.761232924, -73.977556357]], \"11\": [[40.741482413, -73.989990378], [40.741482413, -73.989398282]], \"12\": [[40.688964008, -74.04446323], [40.689412883, -74.045055326]], \"13\": [[40.764375051, -74.001240206], [40.764375051, -74.00064811], [40.764823926, -74.001240206]], \"14\": [[40.713203272, -73.959201375], [40.713203272, -73.958609278], [40.713652147, -73.959201375]], \"15\": [[40.740135787, -73.985253608], [40.739686912, -73.985845704]], \"16\": [[40.73519816, -73.99117457]], \"17\": [[40.730709407, -73.997687629]], \"18\": [[40.729362781, -73.979332646]], \"19\": [[40.826768712, -73.928412371], [40.826768712, -73.929004467]], \"20\": [[40.775596933, -73.965122337]], \"21\": [[40.864025358, -73.882820962], [40.864025358, -73.882228866]], \"22\": [[40.720834151, -73.984069416], [40.720834151, -73.98347732]], \"23\": [[40.75405092, -73.984661512]], \"24\": [[40.687168507, -73.991766667]], \"25\": [[40.729362781, -73.994135052]], \"26\": [[40.774250307, -73.974595876], [40.774699182, -73.974595876]], \"27\": [[40.785921063, -73.985253608]], \"28\": [[40.848314724, -73.881044674]], \"29\": [[40.703328016, -73.99117457]], \"30\": [[40.72756728, -73.94262268], [40.728016155, -73.94262268]], \"31\": [[40.754499796, -73.979924742]], \"32\": [[40.864474233, -73.932557045]], \"33\": [[40.756295297, -73.993542955]], \"34\": [[40.723527403, -73.985253608]], \"35\": [[40.713652147, -73.962161856]], \"36\": [[40.764823926, -73.988214089]], \"37\": [[40.697043763, -73.936109622]], \"38\": [[40.744175665, -74.007161168]], \"39\": [[40.75315317, -73.949135739]], \"40\": [[40.721283027, -74.040318557]], \"41\": [[40.76257955, -73.988214089]], \"42\": [[40.705572393, -74.013674227]], \"43\": [[40.807915951, -73.927228179]], \"44\": [[40.724425153, -73.992950859]], \"45\": [[40.789512065, -73.955648797]], \"46\": [[40.688515133, -74.017226804]], \"47\": [[40.77963681, -73.908873196]], \"48\": [[40.873002863, -73.915386254]], \"49\": [[40.827666462, -73.972819588]], \"50\": [[40.863576483, -73.877492096]], \"51\": [[40.848314724, -73.877492096]], \"52\": [[40.719487526, -73.997095533]], \"53\": [[40.812853579, -73.93018866]], \"54\": [[40.889611247, -73.896439175]], \"55\": [[40.794000818, -73.955648797]], \"56\": [[40.694350511, -73.931372852]], \"57\": [[40.6746, -73.944991065]], \"58\": [[40.772454806, -73.971043299], [40.772454806, -73.970451203], [40.772903681, -73.971635395]], \"59\": [[40.763477301, -73.97400378]], \"60\": [[40.73519816, -73.998871821]], \"61\": [[40.740584663, -74.007161168], [40.740584663, -74.007753265]], \"62\": [[40.767517178, -73.964530241]], \"63\": [[40.74462454, -73.946175258]], \"64\": [[40.746868916, -74.006569072]], \"65\": [[40.701981391, -74.016634708]], \"66\": [[40.803427198, -73.961569759]], \"67\": [[40.71903865, -73.987029897]], \"68\": [[40.829013088, -73.927820275]], \"69\": [[40.703776892, -73.992950859]], \"70\": [[40.745073415, -74.007161168]], \"71\": [[40.702879141, -74.017226804]], \"72\": [[40.728465031, -73.99591134]], \"73\": [[40.712305521, -74.010121649]], \"74\": [[40.756295297, -73.988806186]], \"75\": [[40.724425153, -73.996503436]], \"76\": [[40.711407771, -74.012490034]], \"77\": [[40.689861759, -74.018410997]], \"78\": [[40.769312679, -73.980516838]], \"79\": [[40.799836196, -73.968674914]], \"80\": [[40.720834151, -73.988214089]], \"81\": [[40.733851534, -73.995319244]], \"82\": [[40.76257955, -73.981108935]], \"83\": [[40.721283027, -73.955648797]], \"84\": [[40.704225767, -74.0178189]], \"85\": [[40.873451738, -73.923675601]], \"86\": [[40.690759509, -74.019595189]], \"87\": [[40.873451738, -73.920123024]], \"88\": [[40.854150102, -73.878084192]], \"89\": [[40.714998773, -73.984069416]], \"90\": [[40.678191002, -74.000056014]], \"91\": [[40.748664417, -74.009529553]], \"92\": [[40.768863804, -73.976964261]], \"93\": [[40.751357669, -73.988214089]], \"94\": [[40.710061145, -73.959201375]], \"95\": [[40.758988548, -73.958609278]]}}", "dataType": "dataframe"}
input = dumpsInput(input)
def parseInput(input):
    parsedInput = None
    parsedJson = json.loads(input)
    if(parsedJson['dataType'] == 'int'):
        parsedInput = int(parsedJson['data'])
    elif(parsedJson['dataType'] == 'str'):
        parsedInput = parsedJson['data']
    elif(parsedJson['dataType'] == 'float'):
        parsedInput = float(parsedJson['data'])
    elif(parsedJson['dataType'] == 'bool'):
        if(parsedJson['data'] == 'True'):
            parsedInput = True
        else:
            parsedInput = False
    elif(parsedJson['dataType'] == 'list'):
        parsedInput = json.loads(parsedJson['data'])
    elif(parsedJson['dataType'] == 'dict'):
        parsedInput = json.loads(parsedJson['data'])
    elif(parsedJson['dataType'] == 'dataframe'):
        parsedInput = pd.DataFrame.from_dict(json.loads(parsedJson['data']))
    elif(parsedJson['dataType'] == 'geodataframe'):
        loadedJson = json.loads(parsedJson['data'])
        parsedInput = gpd.GeoDataFrame.from_features(loadedJson)
        if('metadata' in loadedJson):
            metadata = {}
            if('name' in loadedJson['metadata']):
                metadata['name'] = loadedJson['metadata']['name']
            if('style' in loadedJson['metadata']):
                metadata['style'] = loadedJson['metadata']['style']
            parsedInput.metadata = metadata.copy()
    elif(parsedJson['dataType'] == 'raster'):
        parsedInput = rasterio.open(parsedJson['data'])
    elif(parsedJson['dataType'] == 'outputs'):
        parsedInput = []
        for elem in parsedJson['data']:
            parsedInput.append(parseInput(elem))
        parsedInput = tuple(parsedInput)

    return parsedInput

# transforms the whole input into a dict (json) in depth
def toJsonInput(input):
    parsedJson = json.loads(input)
    if(parsedJson['dataType'] == 'outputs'):
        for key, elem in enumerate(parsedJson['data']):
            parsedJson['data'][key] = toJsonInput(elem)

    return parsedJson

def checkIOType(data, boxType, input=True):
    if(input):
        if(boxType == 'DATA_EXPORT' or boxType == 'DATA_CLEANING'):
            if(data['dataType'] == 'outputs'):
                if(len(data['data']) > 1):
                    raise Exception(boxType+' only supports one input')

                for elem in data['data']:
                    if(elem['dataType'] != 'dataframe' and elem['dataType'] != 'geodataframe'):
                        raise Exception(boxType+' only supports DataFrame and GeoDataFrame as input')
            else:
                if(data['dataType'] != 'dataframe' and data['dataType'] != 'geodataframe'):
                    raise Exception(boxType+' only supports DataFrame and GeoDataFrame as input')
        elif(boxType == 'DATA_TRANSFORMATION'):
            if(data['dataType'] == 'outputs'):
                if(len(data['data']) > 2):
                    raise Exception(boxType+' only supports one or two inputs')

                for elem in data['data']:
                    if(elem['dataType'] != 'dataframe' and elem['dataType'] != 'geodataframe' and elem['dataType'] != 'raster'):
                        raise Exception(boxType+' only supports DataFrame, GeoDataFrame and Raster as input')
            else:
                if(data['dataType'] != 'dataframe' and data['dataType'] != 'geodataframe' and data['dataType'] != 'raster'):
                    raise Exception(boxType+' only supports DataFrame, GeoDataFrame and Raster as input')
    else:
        if(boxType == 'DATA_LOADING' or boxType == 'DATA_CLEANING' or boxType == 'DATA_TRANSFORMATION'):
            if(data['dataType'] == 'outputs'):
                if(len(data['data']) > 1 and boxType != 'DATA_LOADING'):
                    raise Exception(boxType+' only supports one output')

                for elem in data['data']:
                    if(elem['dataType'] != 'dataframe' and elem['dataType'] != 'geodataframe' and elem['dataType'] != 'raster'):
                        raise Exception(boxType+' only supports DataFrame, GeoDataFrame and Raster as output')
            else:
                if(data['dataType'] != 'dataframe' and data['dataType'] != 'geodataframe' and data['dataType'] != 'raster'):
                    raise Exception(boxType+' only supports DataFrame, GeoDataFrame and Raster as output')
        elif(boxType == 'DATA_EXPORT'):
            raise Exception(boxType+' does not support output')

incomingInput = None

if(input != '' and input != None):
    checkIOType(toJsonInput(input), boxType)
    incomingInput = parseInput(input)
else:
    incomingInput = ''

output = userCode(incomingInput)

def parseOutput(output):
    jsonOutput = {'data': '', 'dataType': ''}
    outputType = type(output)
    if(outputType == int):
        jsonOutput['data'] = str(output)
        jsonOutput['dataType'] = 'int'
    elif(outputType == str):
        jsonOutput['data'] = output
        jsonOutput['dataType'] = 'str'
    elif(outputType == float):
        jsonOutput['data'] = str(output)
        jsonOutput['dataType'] = 'float'
    elif(outputType == bool):
        jsonOutput['data'] = str(output)
        jsonOutput['dataType'] = 'bool'
    elif(outputType == list):
        jsonOutput['data'] = json.dumps(output)
        jsonOutput['dataType'] = 'list'
    elif(outputType == dict):
        jsonOutput['data'] = json.dumps(output)
        jsonOutput['dataType'] = 'dict'
    elif(outputType == pd.core.frame.DataFrame):
        jsonOutput['data'] = json.dumps(output.to_dict())
        jsonOutput['dataType'] = 'dataframe'
    elif(outputType == gpd.geodataframe.GeoDataFrame):
        jsonOutput['data'] = output.to_json()
        if(hasattr(output, 'metadata')):
            parsedGeojson = json.loads(jsonOutput['data'])
            metadata = {}
            if('name' in output.metadata):
                metadata['name'] = output.metadata['name']
            if('style' in output.metadata):
                metadata['style'] = output.metadata['style']
            parsedGeojson['metadata'] = metadata.copy()
            jsonOutput['data'] = json.dumps(parsedGeojson)
        jsonOutput['dataType'] = 'geodataframe'
    elif(outputType == rasterio.io.DatasetReader):
        jsonOutput['data'] = output.name
        jsonOutput['dataType'] = 'raster'
    elif(outputType == tuple):
        jsonOutput['data'] = []
        jsonOutput['dataType'] = 'outputs'
        for elem in list(output):
            jsonOutput['data'].append(parseOutput(elem))
    return jsonOutput

parsedOutput = parseOutput(output)

checkIOType(parsedOutput, boxType, False)

print(json.dumps(parsedOutput))
