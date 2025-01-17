# Trill

Trill is a declarative small syntax do describe dataflows in Curio.

### Components

- Node
- Edge

### Node

Textual section:

- ID (text)
<!-- - Code/Grammar (reference or NULL) - Optional -->
<!-- - Output data (reference or NULL) - Optional -->
<!-- - Input data (reference or NULL) - Optional -->
- Type (Computation Analysis, Data Transformation, ...)
- Metadata - Optional
    - Dashboard mode (toggle or NULL) - Optional

Binary section (metadata to render the dataflow):

- x,y on the canvas outside dashboard mode
- rendered widgets and values
- node maximized or not
- Code/Grammar 
- Output data
- Input data
- Provenance

### Edge

Textual section:

- ID (text)
- Start (Node ID)
- End (Node ID)
- Type (Data or Interaction) - Optional