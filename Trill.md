### Components

- Node
- Edge

### Node

Textual section:

- ID (text)
- Code/Grammar (reference or NULL) - Optional
- Output data (reference or NULL) - Optional
- Input data (reference or NULL) - Optional
- Provenance (reference or NULL) - Optional
- Dashboard mode (toggle or NULL) - Optional
- Type (Computation Analysis, Data Transformation, ...)
- Comments Thread (reference) - Optional
- Input connection (Node ID or NULL) - Optional 
- Output connection (Node ID or NULL) - Optional
- Interaction ID (Node ID or NULL) - Optional

Binary section (metadata to render the dataflow):

- x,y on the canvas outside dashboard mode
- rendered widgets and values
- node maximized or not