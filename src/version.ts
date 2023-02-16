import * as core from '@actions/core'
import {OSType, getOs, CUDAToolkit} from './platform'
import {AbstractLinks} from './links/links'
import {Method} from './method'
import {SemVer} from 'semver'
import {WindowsLinks} from './links/windows-links'
import {getLinks} from './links/get-links'

// Helper for converting string to SemVer and verifying it exists in the links
export async function getVersion(
  cudaVersionString: string,
  cudnnVersionString: string,
  cudnnDownloadURL: string,
  method: Method
): Promise<CUDAToolkit> {
  const version = new SemVer(cudaVersionString)
  // const cudnn_version = new SemVer(cudnnVersionString)

  const links: AbstractLinks = await getLinks()
  let versions
  let cudnn_versions
  switch (method) {
    case 'local':
      versions = links.getAvailableLocalCudaVersions()
      break
    case 'network':
      switch (await getOs()) {
        case OSType.linux:
          // TODO adapt this to actual available network versions for linux
          versions = links.getAvailableLocalCudaVersions()
          break
        case OSType.windows:
          versions = (links as WindowsLinks).getAvailableNetworkCudaVersions()
          break
      }
  }
  core.debug(`Available CUDA versions: ${versions}`)
  core.debug(`Available cudnn versions: ${cudnn_versions}`)
  if (versions.find(v => v.compare(version) === 0) !== undefined) {
    core.debug(`CUDA Version available: ${version}`)

    const toolkit: CUDAToolkit = {
      cuda_version: version,
      cudnn_version:
        cudnnDownloadURL.length > 0 && cudnnVersionString.length > 0
          ? new SemVer(cudnnVersionString)
          : undefined,
      cuda_url: undefined,
      cudnn_url:
        cudnnDownloadURL.length > 0 && cudnnVersionString.length > 0
          ? new URL(cudnnDownloadURL)
          : undefined
    }
    return toolkit

    // if (
    //   cudnn_versions.find(vv => vv.compare(cudnn_version) === 0) !== undefined
    // ) {
    //   core.debug(`cudnn version available: ${cudnn_version}`)
    //   const toolkit: CUDAToolkit = {
    //     cuda_version: version,
    //     cudnn_version: cudnn_version,
    //     cuda_url: new URL(''),
    //     cudnn_url: new URL('')
    //   }
    //   return toolkit
    // } else {
    //   core.debug(`Version not available error!`)
    //   throw new Error(`Cudnn version not available: ${version}`)
    // }
  } else {
    core.debug(`Version not available error!`)
    throw new Error(`CUDA version not available: ${version}`)
  }
}
