export interface Site {
  id: string
  name: string
  address: string
  city: string
  coordinates?: string
}

export interface Support {
  id: string
  name: string
  type: string
  dimensions?: string
}

export interface Emplacement {
  id: string
  name: string
  siteId: string
  supportId: string
  status: string
}

export interface Asset {
  id: string
  name: string
  fileUrl: string
  type: string
}
