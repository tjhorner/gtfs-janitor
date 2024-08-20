import { describe, expect, it } from "vitest"
import { applyDisambiguationActions, startDisambiguationSession, undoDisambiguationActions } from "./session"
import type { AmbiguousBusStopMatch, DefiniteBusStopMatch } from "../matcher/bus-stops"
import { makeTestNode, makeTestStop } from "$lib/util/test"

function makeAmbiguousMatch(props: Partial<AmbiguousBusStopMatch> = { }): AmbiguousBusStopMatch {
  return {
    ambiguous: true,
    alwaysAmbiguous: false,
    matchedBy: "test",
    elements: [ ],
    ...props
  }
}

describe("applyDisambiguationActions", () => {
  it("applies actions to a given ambiguous match", () => {
    // Assert
    let session = startDisambiguationSession([
      {
        stop: makeTestStop(),
        match: makeAmbiguousMatch({
          elements: [ makeTestNode({ id: 1 }), makeTestNode({ id: 2 }) ]
        })
      }
    ])

    // Act
    session = applyDisambiguationActions(session, 0, [ "match", "ignore" ])

    // Assert
    expect(session.results.matches[0]?.match?.ambiguous).toEqual(false)

    const match = session.results.matches[0]?.match as DefiniteBusStopMatch<string>
    expect(match.element).toMatchObject({ id: 1 })
  })

  it("removes matched or deleted node as candidate for other ambiguous matches", () => {
    // Assert
    let session = startDisambiguationSession([
      {
        stop: makeTestStop(),
        match: makeAmbiguousMatch({
          elements: [ makeTestNode({ id: 1 }), makeTestNode({ id: 2 }), makeTestNode({ id: 3 }) ]
        })
      },
      {
        stop: makeTestStop(),
        match: makeAmbiguousMatch({
          elements: [
            makeTestNode({ id: 1 }),
            makeTestNode({ id: 2 }),
            makeTestNode({ id: 3 }),
            makeTestNode({ id: 4 })
          ]
        })
      }
    ])

    // Act
    session = applyDisambiguationActions(session, 0, [ "match", "ignore", "delete" ])

    // Assert
    expect(session.results.matches[0]?.match?.ambiguous).toEqual(false)
    expect(session.results.matches[1]?.match?.ambiguous).toEqual(true)

    const match = session.results.matches[1]?.match as AmbiguousBusStopMatch
    expect(match.elements).toHaveLength(2)
    expect(match.elements).not.toContainEqual(expect.objectContaining({ id: 1 }))
    expect(match.elements).not.toContainEqual(expect.objectContaining({ id: 3 }))
  })

  it("automatically disambiguates matches after removal of candidates", () => {
    // Assert
    let session = startDisambiguationSession([
      {
        stop: makeTestStop(),
        match: makeAmbiguousMatch({
          elements: [ makeTestNode({ id: 1 }), makeTestNode({ id: 2 }) ]
        })
      },
      {
        stop: makeTestStop(),
        match: makeAmbiguousMatch({
          elements: [ makeTestNode({ id: 1 }), makeTestNode({ id: 2 }) ]
        })
      },
      {
        stop: makeTestStop(),
        match: makeAmbiguousMatch({
          elements: [ makeTestNode({ id: 1 }), makeTestNode({ id: 2 }), makeTestNode({ id: 3 }) ]
        })
      }
    ])

    // Act
    session = applyDisambiguationActions(session, 0, [ "match", "delete" ])

    // Assert
    expect(session.results.matches[0]?.match?.ambiguous).toEqual(false)
    expect(session.results.matches[1]?.match).toBeNull()
    expect(session.results.matches[2]?.match?.ambiguous).toEqual(false)

    const match = session.results.matches[2]?.match as DefiniteBusStopMatch<string>
    expect(match.element).toMatchObject({ id: 3 })
  })

  it("records deleted nodes in the session", () => {
    // Assert
    let session = startDisambiguationSession([
      {
        stop: makeTestStop(),
        match: makeAmbiguousMatch({
          elements: [ makeTestNode({ id: 1 }), makeTestNode({ id: 2 }) ]
        })
      }
    ])

    // Act
    session = applyDisambiguationActions(session, 0, [ "match", "delete" ])

    // Assert
    expect(session.results.deletions).toHaveLength(1)
    expect(session.results.deletions[0]).toMatchObject({ id: 2 })
  })

  it("adds to the undo stack when an action is taken", () => {
    // Assert
    let session = startDisambiguationSession([
      {
        stop: makeTestStop(),
        match: makeAmbiguousMatch({
          elements: [ makeTestNode({ id: 1 }), makeTestNode({ id: 2 }) ]
        })
      }
    ])

    // Act
    session = applyDisambiguationActions(session, 0, [ "match", "ignore" ])

    // Assert
    expect(session.undoStack).toHaveLength(1)
    expect(session.undoStack[0].actions).toEqual([ "match", "ignore" ])
    expect(session.undoStack[0].patches).toBeDefined()
  })
})

describe("undoDisambiguationActions", () => {
  it("undoes the last action in the disambiguation session", () => {
    // Assert
    let session = startDisambiguationSession([
      {
        stop: makeTestStop(),
        match: makeAmbiguousMatch({
          elements: [ makeTestNode({ id: 1 }), makeTestNode({ id: 2 }) ]
        })
      }
    ])

    const initialResults = session.results

    // Act
    session = applyDisambiguationActions(session, 0, [ "match", "delete" ])
    
    // Assert
    expect(session.undoStack).toHaveLength(1)
    
    // Act
    const [ sessionAfterUndo, actions ] = undoDisambiguationActions(session)

    // Assert
    expect(sessionAfterUndo.results).toMatchObject(initialResults)
    expect(sessionAfterUndo.undoStack).toHaveLength(0)
    expect(actions).toEqual([ "match", "delete" ])
  })
})