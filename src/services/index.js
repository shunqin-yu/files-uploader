import axios from 'axios'


const Service = (url, params) => {
  return axios.post(url, params)
}

export default Service