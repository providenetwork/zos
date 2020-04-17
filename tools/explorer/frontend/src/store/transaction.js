import tfService from '../services/tfService'
import lodash from 'lodash'

// keep the interval object locally to clear them afterwards
let nodesLoadingInterval, farmsLoadingInterval

const getDefaultState = () => {
  return {
    user: {},
    registeredNodes: [],
    nodePage: 2,
    farmPage: 2,
    nodes: undefined,
    registeredFarms: [],
    farms: [],
    nodeSpecs: {
      amountregisteredNodes: 0,
      amountregisteredFarms: 0,
      countries: 0,
      onlinenodes: 0,
      cru: 0,
      mru: 0,
      sru: 0,
      hru: 0,
      network: 0,
      volume: 0,
      container: 0,
      zdb_namespace: 0,
      k8s_vm: 0
    }
  }
}

export default ({
  state: getDefaultState(),
  actions: {
    getName: async context => {
      var response = await tfService.getName()
      return response.data.name
    },
    getUser: async context => {
      var name = await context.dispatch('getName')
      var response = await tfService.getUser(name)
      context.commit('setUser', response.data)
    },
    getRegisteredNodes (context, params) {
      let page = params.page || context.state.nodePage

      tfService.getNodes(undefined, params.size, page).then(response => {
        context.commit('setRegisteredNodes', response)
        context.commit('setTotalSpecs', response.data)
      })
    },
    getRegisteredFarms (context, params) {
      let page = params.page || context.state.farmPage

      tfService.registeredfarms(params.size, page).then(response => {
        context.commit('setAmountOfFarms', response.data)
        context.commit('setRegisteredFarms', response)
      })
    },
    getFarms: context => {
      tfService.getFarms(context.getters.user.id).then(response => {
        context.commit('setFarms', response.data)
      })
    },
    resetNodes: context => {
      context.commit('setNodes', undefined)
    },
    resetState: context => {
      context.commit('resetState')
    },
    refreshData: ({ dispatch }) => {
      // clear intervals first
      clearInterval(nodesLoadingInterval)
      clearInterval(farmsLoadingInterval)

      // reset the vuex store
      dispatch('resetState')

      // load 100 nodes and farms
      dispatch('getRegisteredNodes', { size: 100, page: 1 })
      dispatch('getRegisteredFarms', { size: 100, page: 1 })

      // load all the rest of nodes and farms over time
      dispatch('initialiseFarmsLoading')
      dispatch('initialiseNodesLoading')
    },
    initialiseNodesLoading ({ dispatch }) {
      nodesLoadingInterval = setInterval(() => {
        dispatch('getRegisteredNodes', { size: 50 })
      }, 500)
    },
    initialiseFarmsLoading ({ dispatch }) {
      farmsLoadingInterval = setInterval(() => {
        dispatch('getRegisteredFarms', { size: 50 })
      }, 500)
    }
  },
  mutations: {
    setRegisteredNodes (state, response) {
      if (response.data.length === 0) {
        state.nodePage = undefined
        // all nodes are loaded, clear the interval
        return clearInterval(nodesLoadingInterval)
      }
      // more pages to load, concat data and increase page number
      state.registeredNodes = state.registeredNodes.concat(response.data)
      state.nodePage += 1
    },
    setRegisteredFarms (state, response) {
      if (response.data.length === 0) {
        state.farmPage = undefined
        // all farms are loaded, clear the interval
        return clearInterval(farmsLoadingInterval)
      }
      // more pages to load, concat data and increase page number
      state.registeredFarms = state.registeredFarms.concat(response.data)
      state.farmPage += 1
    },
    setFarms (state, value) {
      state.farms = value
    },
    setNodes (state, value) {
      state.nodes = value
    },
    setUser: (state, user) => {
      state.user = user
    },
    setAmountOfFarms (state, value) {
      state.nodeSpecs.amountregisteredFarms = value.length
    },
    setTotalSpecs (state, value) {
      if (value.length === 0) {
        return
      }
      state.nodeSpecs.amountregisteredNodes += value.length
      state.nodeSpecs.onlinenodes += countOnlineNodes(value)
      state.nodeSpecs.countries += lodash.uniqBy(
        value,
        node => node.location.country
      ).length
      state.nodeSpecs.cru += lodash.sumBy(value, node => node.total_resources.cru)
      state.nodeSpecs.mru += lodash.sumBy(value, node => node.total_resources.mru)
      state.nodeSpecs.sru += lodash.sumBy(value, node => node.total_resources.sru)
      state.nodeSpecs.hru += lodash.sumBy(value, node => node.total_resources.hru)
      state.nodeSpecs.network += lodash.sumBy(value, node => node.workloads.network)
      state.nodeSpecs.volume += lodash.sumBy(value, node => node.workloads.volume)
      state.nodeSpecs.container += lodash.sumBy(value, node => node.workloads.container)
      state.nodeSpecs.zdb_namespace += lodash.sumBy(value, node => node.workloads.zdb_namespace)
      state.nodeSpecs.k8s_vm += lodash.sumBy(value, node => node.workloads.k8s_vm)
    },
    resetState (state) {
      // Merge rather than replace so we don't lose observers
      // https://github.com/vuejs/vuex/issues/1118
      Object.assign(state, getDefaultState())
    }
  },
  getters: {
    user: state => state.user,
    registeredNodes: state => state.registeredNodes,
    nodes: state => state.nodes,
    registeredFarms: state => state.registeredFarms,
    farms: state => state.farms,
    nodeSpecs: state => state.nodeSpecs,
    nodePage: state => state.nodePage,
    farmPage: state => state.farmPage
  }
})

function countOnlineNodes (data) {
  let onlinecounter = 0
  data.forEach(node => {
    const timestamp = new Date().getTime() / 1000
    const minutes = (timestamp - node.updated) / 60
    if (minutes < 20) onlinecounter++
  })
  return onlinecounter
}