/**
 * SPARQL Queries for Code Logic
 *
 * This module contains SPARQL queries used in the application logic
 * for computing values, validations, and data analysis.
 *
 * @file sparql-queries-code.js
 * @version 8a
 * @date 2026-01-26
 */

/**
 * SPARQL_CODE_QUERIES - Collection of SPARQL queries used in code
 * These queries are for data analysis and computation, not for populating dropdowns
 */
const SPARQL_CODE_QUERIES = {
    /**
     * Query to check if process has a TriG schema (vad:hasTrig)
     * Used: Determining if process is Detailed or notDetailed
     * @param {string} processUri - URI of the process
     */
    PROCESS_HAS_TRIG: (processUri) => `
        ASK WHERE {
            GRAPH vad:ptree {
                <${processUri}> vad:hasTrig ?trig .
            }
        }
    `,

    /**
     * Query to get the TriG schema of a process
     * Used: Getting the child schema for Detailed processes
     * @param {string} processUri - URI of the process
     */
    GET_PROCESS_TRIG: (processUri) => `
        SELECT ?trig WHERE {
            GRAPH vad:ptree {
                <${processUri}> vad:hasTrig ?trig .
            }
        }
    `,

    /**
     * Query to get the parent TriG of a schema
     * Used: Determining DetailedChild vs DetailedExternal
     * @param {string} trigUri - URI of the TriG schema
     */
    GET_PARENT_TRIG: (trigUri) => `
        SELECT ?parentTrig WHERE {
            GRAPH <${trigUri}> {
                <${trigUri}> vad:hasParentTrig ?parentTrig .
            }
        }
    `,

    /**
     * Query to get parent process from ptree
     * Used: Determining notDetailedChild vs notDetailedExternal
     * @param {string} processUri - URI of the process
     */
    GET_PARENT_PROCESS: (processUri) => `
        SELECT ?parentProcess WHERE {
            GRAPH vad:ptree {
                <${processUri}> vad:hasParentProcess ?parentProcess .
            }
        }
    `,

    /**
     * Query to get the process that defines a TriG schema
     * Used: Determining the parent process of a schema
     * @param {string} trigUri - URI of the TriG schema
     */
    GET_TRIG_DEFINES_PROCESS: (trigUri) => `
        SELECT ?process WHERE {
            GRAPH <${trigUri}> {
                <${trigUri}> vad:definesProcess ?process .
            }
        }
    `,

    /**
     * Query to get all processes in a specific TriG
     * Used: Building the list of processes shown on a schema
     * @param {string} trigUri - URI of the TriG schema
     */
    PROCESSES_IN_TRIG: (trigUri) => `
        SELECT ?process WHERE {
            GRAPH <${trigUri}> {
                ?process vad:isSubprocessTrig <${trigUri}> .
            }
        }
    `,

    /**
     * Query to compute processSubtype for Detailed processes
     * Used: Calculating if DetailedChild or DetailedExternal
     * @param {string} processUri - URI of the process
     * @param {string} currentTrigUri - URI of the current TriG schema
     */
    COMPUTE_DETAILED_SUBTYPE: (processUri, currentTrigUri) => `
        SELECT ?subtype WHERE {
            GRAPH vad:ptree {
                <${processUri}> vad:hasTrig ?childTrig .
            }
            GRAPH ?childTrig {
                ?childTrig vad:hasParentTrig ?parentTrig .
            }
            BIND(
                IF(?parentTrig = <${currentTrigUri}>,
                   <http://example.org/vad#DetailedChild>,
                   <http://example.org/vad#DetailedExternal>
                ) AS ?subtype
            )
        }
    `,

    /**
     * Query to compute processSubtype for notDetailed processes
     * Used: Calculating if notDetailedChild, notDetailedExternal, or NotDefinedType
     * @param {string} processUri - URI of the process
     * @param {string} currentParentProcessUri - URI of the parent process of current schema
     */
    COMPUTE_NOT_DETAILED_SUBTYPE: (processUri, currentParentProcessUri) => `
        SELECT ?subtype WHERE {
            GRAPH vad:ptree {
                <${processUri}> vad:hasParentProcess ?parentProcess .
            }
            BIND(
                IF(?parentProcess = <http://example.org/vad#NotDefined>,
                   <http://example.org/vad#NotDefinedType>,
                   IF(?parentProcess = <${currentParentProcessUri}>,
                      <http://example.org/vad#notDetailedChild>,
                      <http://example.org/vad#notDetailedExternal>
                   )
                ) AS ?subtype
            )
        }
    `,

    /**
     * Query to delete hasParentProcess when creating new TriG
     *
     * IMPORTANT RULE: vad:hasTrig and vad:hasParentProcess are MUTUALLY EXCLUSIVE
     * When a process gets its own TriG schema (becomes "Detailed"), we must:
     * 1. Delete any existing vad:hasParentProcess (was "notDetailed")
     * 2. Add vad:hasTrig (becomes "Detailed")
     *
     * This rule is implemented in createNewTrig() function in index.html
     * The generated SPARQL query includes this DELETE before INSERT
     *
     * Used: Rule for creating new TriG schema
     * @param {string} processUri - URI of the process
     */
    DELETE_HAS_PARENT_PROCESS: (processUri) => `
        DELETE WHERE {
            GRAPH vad:ptree {
                <${processUri}> vad:hasParentProcess ?parentProcess .
            }
        }
    `,

    /**
     * Query to check if hasParentProcess is NotDefined
     * Used: Validation before creating new TriG
     * @param {string} processUri - URI of the process
     */
    CHECK_PARENT_PROCESS_NOT_DEFINED: (processUri) => `
        ASK WHERE {
            GRAPH vad:ptree {
                <${processUri}> vad:hasParentProcess <http://example.org/vad#NotDefined> .
            }
        }
    `,

    /**
     * Query to insert new TriG metadata
     * Used: Creating new VADProcessDia
     * @param {string} trigUri - URI of the new TriG
     * @param {string} trigLabel - Label for the TriG
     * @param {string} parentTrigUri - URI of the parent TriG
     * @param {string} processUri - URI of the process this TriG defines
     */
    INSERT_NEW_TRIG: (trigUri, trigLabel, parentTrigUri, processUri) => `
        INSERT DATA {
            GRAPH <${trigUri}> {
                <${trigUri}> rdf:type vad:VADProcessDia .
                <${trigUri}> rdfs:label "${trigLabel}" .
                <${trigUri}> vad:hasParentTrig <${parentTrigUri}> .
                <${trigUri}> vad:definesProcess <${processUri}> .
            }
            GRAPH vad:ptree {
                <${processUri}> vad:hasTrig <${trigUri}> .
            }
        }
    `,

    /**
     * Query to get all virtual processSubtype values for a TriG
     * Used: Building virtualRDFdata
     * @param {string} trigUri - URI of the TriG schema
     */
    GET_VIRTUAL_SUBTYPES_FOR_TRIG: (trigUri) => `
        SELECT ?process ?subtype WHERE {
            GRAPH <${trigUri}> {
                ?process vad:isSubprocessTrig <${trigUri}> .
            }
            # Check if process has TriG
            OPTIONAL {
                GRAPH vad:ptree {
                    ?process vad:hasTrig ?childTrig .
                }
                GRAPH ?childTrig {
                    ?childTrig vad:hasParentTrig ?parentTrig .
                }
            }
            # Check if process has parent process
            OPTIONAL {
                GRAPH vad:ptree {
                    ?process vad:hasParentProcess ?parentProcess .
                }
            }
            # Determine subtype
            BIND(
                IF(BOUND(?childTrig),
                   IF(?parentTrig = <${trigUri}>,
                      <http://example.org/vad#DetailedChild>,
                      <http://example.org/vad#DetailedExternal>
                   ),
                   IF(?parentProcess = <http://example.org/vad#NotDefined>,
                      <http://example.org/vad#NotDefinedType>,
                      IF(BOUND(?parentProcess),
                         <http://example.org/vad#notDetailedChild>,
                         <http://example.org/vad#notDetailedChild>
                      )
                   )
                ) AS ?subtype
            )
        }
    `,

    /**
     * Query to check if a TriG has child TriGs that reference it as parent
     * Used: Validation before deleting a TriG - parent TriG cannot be deleted
     * @param {string} trigUri - URI of the TriG to check
     */
    CHECK_HAS_CHILD_TRIGS: (trigUri) => `
        SELECT ?childTrig ?childProcess WHERE {
            ?childTrig vad:hasParentTrig <${trigUri}> .
            OPTIONAL {
                ?childTrig vad:definesProcess ?childProcess .
            }
        }
    `,

    /**
     * Query to get the process that is defined by a TriG
     * Used: When deleting a TriG, we need to update the process in ptree
     * @param {string} trigUri - URI of the TriG
     */
    GET_TRIG_PROCESS: (trigUri) => `
        SELECT ?process WHERE {
            GRAPH <${trigUri}> {
                <${trigUri}> vad:definesProcess ?process .
            }
        }
    `,

    /**
     * Query to delete a TriG and update process in ptree
     * This removes vad:hasTrig from ptree and adds vad:hasParentProcess
     * @param {string} trigUri - URI of the TriG to delete
     * @param {string} processUri - URI of the process defined by this TriG
     * @param {string} parentTrigUri - URI of the parent TriG
     */
    DELETE_TRIG_SPARQL: (trigUri, processUri, parentTrigUri) => `
        # Remove vad:hasTrig from ptree
        DELETE {
            GRAPH vad:ptree {
                <${processUri}> vad:hasTrig <${trigUri}> .
            }
        }
        WHERE {
            GRAPH vad:ptree {
                <${processUri}> vad:hasTrig <${trigUri}> .
            }
        };

        # Add vad:hasParentProcess to ptree (parent process from parent TriG)
        INSERT DATA {
            GRAPH vad:ptree {
                <${processUri}> vad:hasParentProcess <${parentTrigUri}> .
            }
        };

        # Delete the TriG graph contents
        DROP GRAPH <${trigUri}>
    `
};
