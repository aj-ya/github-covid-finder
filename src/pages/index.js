import React, { useEffect, useReducer, useState, useRef } from 'react'
import { Grid, Spinner } from 'theme-ui'

import * as githubApi from '../api/github'
import Layout from '../components/layout'
import RepoCard from '../components/repoCard'
import mockRepos from '../mocks/mockRepos'
import Pagination from '../components/pagination'
import SEO from '../components/SEO'

const INITIAL_STATE = {
  term: '',
  sort: 'stars',
  filter: '',
  page: 1,
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'search':
      return { ...state, term: action.payload, page: 1 }
    case 'sort':
      return { ...state, sort: action.payload, page: 1 }
    case 'filter':
      return { ...state, filter: action.payload, page: 1 }
    case 'reset':
      return INITIAL_STATE
    case 'pageUp':
      return { ...state, page: action.payload }
    case 'pageDown':
      return { ...state, page: action.payload }
    default:
      return INITIAL_STATE
  }
}

const buildSearchQuery = searchState => {
  let query = ''

  if (searchState.term !== '') {
    query += `+${searchState.term}`
  }

  if (searchState.filter !== '') {
    const languageFilter =
      searchState.filter === 'C / C++'
        ? searchState.filter.replace('C / C++', 'C%2FC++')
        : searchState.filter

    query += `+language:${languageFilter}`
  }

  if (searchState.sort !== '') {
    query += `&sort=${searchState.sort}`
  }

  return `${query}&per_page=30&page=${searchState.page}`
}

function fetchData(searchState) {
  return githubApi.searchCovidRelatedRepositories(buildSearchQuery(searchState))
}

const Index = () => {
  const refSearch = useRef(null)
  const [repos, setRepos] = useState(null)
  const [totalResults, setTotalResults] = useState(null)
  const [isFetchingData, setIsFetchingData] = useState(true)
  const [searchState, dispatch] = useReducer(reducer, INITIAL_STATE)

  useEffect(() => {
    const fetchDataAndSetState = async () => {
      const data = await fetchData(searchState)

      if (data) {
        setRepos(data)
        setTotalResults(data.total_count)
      }

      setIsFetchingData(false)
    }
    // Avoid request while developing
    if (process.env.NODE_ENV === 'development') {
      setRepos(mockRepos)
      setIsFetchingData(false)
      return
    }

    fetchDataAndSetState()
  }, [searchState])

  const onSearchChange = field => e => {
    if (searchState.page * 30 < totalResults && field === 'pageUp') {
      dispatch({ type: field, payload: searchState.page + 1 })
      refSearch.current.scrollIntoView()
      return
    }

    if (searchState.page > 1 && field === 'pageDown') {
      dispatch({ type: field, payload: searchState.page - 1 })
      refSearch.current.scrollIntoView()
      return
    }
    dispatch({ type: field, payload: e.target.value })
  }

  if (!repos) return null

  return (
    <Layout
      isShowSearch
      searchCompProps={{
        setRepos,
        setTotalResults,
        fetchData,
        searchState,
        setIsFetchingData,
        onSearchChange: onSearchChange('search'),
        onSortChange: onSearchChange('sort'),
        onFilterChange: onSearchChange('filter'),
      }}
    >
      <SEO />
      <span ref={refSearch}/>
      { isFetchingData
        ? <Spinner
            color="rgb(255, 65, 54)"
            sx={{
              top: '50%',
              left: '50%',
              position: 'absolute',
              transform: 'translate(-50%, -50%)',
            }}
          />
        : <>
            <Grid columns={[1, 1, 1, 3]}>
              {repos.items.map(repo => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </Grid>
            <Pagination
              pageUp={onSearchChange('pageUp')}
              pageDown={onSearchChange('pageDown')}
              currentPage={searchState.page}
              totalResults={totalResults}
            />
          </>
      }
    </Layout>
  )
}

export default Index
