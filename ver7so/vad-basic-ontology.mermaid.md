# Basic VAD Ontology - Graphical Representation

## Mermaid Diagram

This document provides a graphical representation of the Basic VAD Ontology using Mermaid diagrams.

### Class Diagram

```mermaid
classDiagram
    direction TB

    %% ======================================
    %% CLASSES
    %% ======================================

    class Process {
        <<Class>>
        +rdf:type vad:Process
        +rdfs:label : string
        +dcterms:description : string
        +vad:hasTrig : VADProcessDia [0..1]
        ---
        Individual properties in VADProcessDia:
        +vad:hasExecutor : ExecutorGroup
        +vad:processSubtype : Basic|Detailed|DetailedChild|DetailedExternal
        +vad:hasNext : Process [0..*]
    }

    class VADProcessDia {
        <<Class>>
        TriG Named Graph
        +rdf:type vad:VADProcessDia
        +rdfs:label : string
        +vad:hasParentTrig : VADProcessDia|root
        +vad:definesProcess : Process [0..1]
    }

    class ProcessTree {
        <<Class>>
        Single instance: vad:ptree
        +rdf:type vad:ProcessTree
        +rdfs:label : string
        +vad:hasParentTrig : root
        Contains PTREE_PREDICATES for all Process
    }

    class ExecutorTree {
        <<Class>>
        Single instance: vad:rtree
        +rdf:type vad:ExecutorTree
        +rdfs:label : string
        +vad:hasParentTrig : root
        Contains RTREE_PREDICATES for all Executor
    }

    class ExecutorGroup {
        <<Class>>
        +rdf:type vad:ExecutorGroup
        +rdfs:label : string
        +vad:includes : Executor [1..*]
    }

    class Executor {
        <<Class>>
        Stored in vad:rtree
        +rdf:type vad:Executor
        +rdfs:label : string
    }

    class Basic {
        <<Subtype of Process>>
        No child diagram
    }

    class Detailed {
        <<Subtype of Process>>
        Has child diagram via hasTrig
        Parent class for DetailedChild, DetailedExternal
    }

    class DetailedChild {
        <<Subtype of Detailed>>
        Child diagram has hasParentTrig to current diagram
    }

    class DetailedExternal {
        <<Subtype of Detailed>>
        Child diagram does NOT have hasParentTrig to current diagram
    }

    class root {
        <<Technical Instance>>
        Invisible tree root
    }

    class ptree {
        <<Instance of ProcessTree>>
        Stores shared Process metadata
    }

    class rtree {
        <<Instance of ExecutorTree>>
        Stores shared Executor metadata
    }

    %% ======================================
    %% RELATIONSHIPS
    %% ======================================

    Process "1" --> "0..1" VADProcessDia : hasTrig
    VADProcessDia "1" --> "0..1" Process : definesProcess
    Process "1" --> "1" ExecutorGroup : hasExecutor
    Process "1" --> "0..*" Process : hasNext
    Process "1" --> "1" Basic : processSubtype
    Process "1" --> "1" Detailed : processSubtype
    Process "1" --> "1" DetailedChild : processSubtype
    Process "1" --> "1" DetailedExternal : processSubtype

    ExecutorGroup "1" --> "1..*" Executor : includes

    VADProcessDia "1" --> "1" VADProcessDia : hasParentTrig
    VADProcessDia "1" --> "1" root : hasParentTrig

    ProcessTree "1" --> "1" root : hasParentTrig
    ExecutorTree "1" --> "1" root : hasParentTrig

    Basic --|> Process : subClassOf
    Detailed --|> Process : subClassOf
    DetailedChild --|> Detailed : subClassOf
    DetailedExternal --|> Detailed : subClassOf

    ptree ..|> ProcessTree : instanceOf
    rtree ..|> ExecutorTree : instanceOf
```

### Property Groups Diagram

```mermaid
flowchart TB
    subgraph PTREE["vad:ptree (PTREE_PREDICATES)"]
        direction TB
        PT1["rdf:type vad:Process"]
        PT2["rdfs:label"]
        PT3["dcterms:description"]
        PT4["vad:hasTrig"]
    end

    subgraph RTREE["vad:rtree (RTREE_PREDICATES)"]
        direction TB
        RT1["rdf:type vad:Executor"]
        RT2["rdfs:label"]
    end

    subgraph VADDIA["VADProcessDia (Individual Properties)"]
        direction TB
        VP1["vad:hasExecutor"]
        VP2["vad:processSubtype"]
        VP3["vad:hasNext"]
        VP4["vad:definesProcess"]
    end

    PROCESS[("vad:Process\n(instance)")]
    EXECUTOR[("vad:Executor\n(instance)")]

    PTREE --> |"Shared metadata\nfor all diagrams"| PROCESS
    RTREE --> |"Shared metadata\nfor all diagrams"| EXECUTOR
    VADDIA --> |"Unique properties\nper diagram"| PROCESS
```

### TriG Hierarchy Example

Based on `exampleTrigVADv2` from `index.html`:

```mermaid
flowchart TB
    subgraph ROOT["vad:root (invisible)"]
        direction TB
    end

    subgraph PTREE["vad:ptree"]
        direction TB
        PTREE_TYPE["rdf:type: vad:ProcessTree"]
        PTREE_LABEL["rdfs:label: Дерево Процессов"]
        PTREE_PARENT["hasParentTrig: vad:root"]

        subgraph PTREE_PROCESSES["Process Metadata"]
            PGA["vad:pGA\nГруппа Процессов А\nhasTrig: t_pGA"]
            P1["vad:p1\np1 Процесс 1\nhasTrig: t_p1"]
            P2["vad:Process2\nПроцесс 2"]
            P3["vad:Process3\nПроцесс 3"]
            Pmore["...Process4-8"]
            P21["vad:Process21\nПроцесс 21"]
            P2more["...Process22-28"]
        end
    end

    subgraph RTREE["vad:rtree"]
        direction TB
        RTREE_TYPE["rdf:type: vad:ExecutorTree"]
        RTREE_LABEL["rdfs:label: Дерево Исполнителей"]
        RTREE_PARENT["hasParentTrig: vad:root"]

        subgraph RTREE_EXEC["Executor Metadata"]
            E1["vad:Executor1\nИсполнитель 1"]
            E2["vad:Executor2\nИсполнитель 2"]
            Emore["...Executor3-28"]
        end
    end

    subgraph T_PGA["vad:t_pGA"]
        direction TB
        TGA_TYPE["rdf:type: vad:VADProcessDia"]
        TGA_LABEL["rdfs:label: Схема процесса t_pGA"]
        TGA_PARENT["hasParentTrig: vad:root"]
        TGA_DEFINES["definesProcess: vad:pGA"]

        subgraph TGA_CHAIN["Process Chain"]
            C_P1["vad:p1\nhasExecutor: ExecutorGroup1\nprocessSubtype: DetailedChild\nhasNext: Process2"]
            C_P2["vad:Process2\nhasNext: Process3, Process4"]
            C_P3["vad:Process3\nhasNext: Process4"]
            C_more["..."]
        end

        subgraph TGA_EXEC["Executor Groups"]
            EG1["ExecutorGroup1\nincludes: Executor1"]
            EG2["ExecutorGroup2\nincludes: Executor1, Executor2"]
            EGmore["..."]
        end
    end

    subgraph T_P1["vad:t_p1"]
        direction TB
        TP1_TYPE["rdf:type: vad:VADProcessDia"]
        TP1_LABEL["rdfs:label: Схема процесса t_p1"]
        TP1_PARENT["hasParentTrig: vad:t_pGA"]
        TP1_DEFINES["definesProcess: vad:p1"]

        subgraph TP1_CHAIN["Process Chain"]
            C_P21["vad:Process21\nhasNext: Process22"]
            C_P22["vad:Process22\nhasNext: Process23, Process24"]
            C_more2["...Process23-28"]
        end
    end

    ROOT --> PTREE
    ROOT --> RTREE
    ROOT --> T_PGA
    T_PGA --> T_P1

    P1 -.->|"hasTrig"| T_P1
    PGA -.->|"hasTrig"| T_PGA
    T_P1 -.->|"definesProcess"| P1
    T_PGA -.->|"definesProcess"| PGA
```

### VAD Process Chain Visualization

Example of `vad:t_pGA` process chain:

```mermaid
flowchart LR
    subgraph EXECUTORS["Executors Row (from vad:rtree)"]
        E1["Исполнитель 1"]
        E2["Исполнитель 2"]
        E3["Исполнитель 3"]
        E4["Исполнитель 4"]
        E5["Исполнитель 5"]
        E6["Исполнитель 6"]
        E7["Исполнитель 7"]
        E8["Исполнитель 8"]
    end

    subgraph CHAIN["VAD Chain: t_pGA"]
        P1["p1 Процесс 1\n(DetailedChild)"]
        P2["Процесс 2\n(Basic)"]
        P3["Процесс 3\n(Basic)"]
        P4["Процесс 4\n(Basic)"]
        P5["Процесс 5\n(Basic)"]
        P6["Процесс 6\n(Basic)"]
        P7["Процесс 7\n(Basic)"]
        P8["Процесс 8\n(Basic)"]
    end

    P1 -->|hasNext| P2
    P2 -->|hasNext| P3
    P2 -->|hasNext| P4
    P3 -->|hasNext| P4
    P4 -->|hasNext| P5
    P5 -->|hasNext| P6
    P6 -->|hasNext| P7
    P7 -->|hasNext| P8

    E1 -.->|ExecutorGroup1| P1
    E1 -.->|ExecutorGroup2| P2
    E2 -.->|ExecutorGroup2| P2
    E3 -.->|ExecutorGroup3| P3
    E3 -.->|ExecutorGroup4| P4
    E4 -.->|ExecutorGroup4| P4
    E5 -.->|ExecutorGroup5| P5
    E6 -.->|ExecutorGroup5| P5
    E7 -.->|ExecutorGroup6| P6
    E8 -.->|ExecutorGroup6| P6
    E1 -.->|ExecutorGroup7| P7
    E5 -.->|ExecutorGroup7| P7
    E2 -.->|ExecutorGroup8| P8
    E7 -.->|ExecutorGroup8| P8

    style P1 fill:#ffcc00,stroke:#333
    style P2 fill:#87ceeb,stroke:#333
    style P3 fill:#87ceeb,stroke:#333
    style P4 fill:#87ceeb,stroke:#333
    style P5 fill:#87ceeb,stroke:#333
    style P6 fill:#87ceeb,stroke:#333
    style P7 fill:#87ceeb,stroke:#333
    style P8 fill:#87ceeb,stroke:#333
```

Legend:
- Yellow: DetailedChild process (has child diagram via `hasTrig`, child has `hasParentTrig` to current)
- Blue: Basic process (no child diagram)
- (Not shown) DetailedExternal: would have different color for processes referencing external diagrams

### Data Flow Diagram

```mermaid
flowchart TB
    subgraph INPUT["Input: TriG Data"]
        TRIG["TriG Text\n(exampleTrigVADv2)"]
    end

    subgraph PARSE["Parsing"]
        PARSER["N3.js Parser"]
    end

    subgraph STORE["Data Storage"]
        QUADS["RDF Quads"]
        subgraph PTREE_DATA["vad:ptree Data"]
            PTREE_QUADS["Shared Process Metadata\n(PTREE_PREDICATES)"]
        end
        subgraph RTREE_DATA["vad:rtree Data"]
            RTREE_QUADS["Shared Executor Metadata\n(RTREE_PREDICATES)"]
        end
        subgraph TRIG_DATA["VADProcessDia Data"]
            TRIG_QUADS["Individual Process Properties"]
        end
    end

    subgraph RENDER["Visualization"]
        TREE["TriG Tree Window"]
        VAD["VAD Diagram"]
        PROPS["Properties Panel"]
    end

    TRIG --> PARSER
    PARSER --> QUADS
    QUADS --> PTREE_DATA
    QUADS --> RTREE_DATA
    QUADS --> TRIG_DATA
    PTREE_DATA --> TREE
    RTREE_DATA --> TREE
    PTREE_DATA --> VAD
    RTREE_DATA --> VAD
    TRIG_DATA --> VAD
    PTREE_DATA --> PROPS
    RTREE_DATA --> PROPS
    TRIG_DATA --> PROPS
```

## Summary Table

| Concept | Class | Storage Location | JS Constant |
|---------|-------|------------------|-------------|
| Process (type) | `vad:Process` | `vad:ptree` | `VAD_ALLOWED_TYPES` |
| Process (label) | - | `vad:ptree` | `PTREE_PREDICATES` |
| Process (description) | - | `vad:ptree` | `PTREE_PREDICATES` |
| Process (hasTrig) | - | `vad:ptree` | `PTREE_PREDICATES` |
| Process (hasNext) | - | `VADProcessDia` | `VAD_ALLOWED_PREDICATES` |
| Process (hasExecutor) | - | `VADProcessDia` | `VAD_ALLOWED_PREDICATES` |
| Process (processSubtype) | - | `VADProcessDia` | `VAD_ALLOWED_PREDICATES` |
| Executor (type) | `vad:Executor` | `vad:rtree` | `VAD_ALLOWED_TYPES` |
| Executor (label) | - | `vad:rtree` | `RTREE_PREDICATES` |
| ExecutorGroup | `vad:ExecutorGroup` | `VADProcessDia` | `VAD_ALLOWED_TYPES` |
| TriG (definesProcess) | - | `VADProcessDia` | `VAD_ALLOWED_PREDICATES` |

## Process Subtypes

| Subtype | Description | Visual Indicator |
|---------|-------------|------------------|
| `vad:Basic` | No child diagram | Blue fill |
| `vad:Detailed` | Has child diagram (parent class) | Yellow fill |
| `vad:DetailedChild` | Child diagram has `hasParentTrig` to current | Yellow fill |
| `vad:DetailedExternal` | Child diagram does NOT have `hasParentTrig` to current | Yellow fill (with external indicator) |
