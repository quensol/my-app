"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { 
  AnalysisData, 
  AnalysisDetail,
  Cooccurrence, 
  SearchVolume, 
  Competitor,
  UserProfile
} from "@/types/analysis"
import { OverviewChart } from './charts/overview-chart'
import { CooccurrenceChart } from './charts/cooccurrence-chart'
import { VolumeChart } from './charts/volume-chart'
import { CompetitorChart } from './charts/competitor-chart'
import { UserProfilesChart } from './charts/user-profiles-chart'

interface AnalysisResultsProps {
  analysisId: number
  type: "overview" | "cooccurrence" | "volume" | "competitors" | "user-profiles"
  key?: number
}

export function AnalysisResults({ analysisId, type, key }: AnalysisResultsProps) {
  const [data, setData] = useState<AnalysisData | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`��始获取${type}数据, analysisId=${analysisId}${key ? `, key=${key}` : ''}`)
        let endpoint = `http://localhost:8000/api/v1/keyword/`
        switch (type) {
          case "overview":
            endpoint += `analysis/${analysisId}`
            break
          case "cooccurrence":
            endpoint += `cooccurrence/${analysisId}`
            break
          case "volume":
            endpoint += `search-volume/${analysisId}`
            break
          case "competitors":
            endpoint += `competitors/${analysisId}`
            break
          case "user-profiles":
            endpoint += `analysis/${analysisId}/user-profiles/distribution`
            break
        }

        const response = await fetch(endpoint)
        if (!response.ok) throw new Error("获取数据失败")
        const result = await response.json()
        console.log(`${type}数据获取成功:`, result)
        setData(result)
      } catch (error) {
        console.error(`${type}数据获取失败:`, error)
        toast({
          title: "数据加载失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        })
      }
    }

    fetchData()
  }, [analysisId, type, toast, key])

  if (!data) return <div>加载中...</div>

  const renderTableHeader = () => {
    switch (type) {
      case "overview":
        return (
          <TableRow>
            <TableHead className="whitespace-nowrap">种子关键词</TableHead>
            <TableHead className="text-right whitespace-nowrap">总搜索量</TableHead>
            <TableHead className="text-right whitespace-nowrap">种子搜索量</TableHead>
            <TableHead className="text-right whitespace-nowrap">搜索占比(%)</TableHead>
          </TableRow>
        )
      case "cooccurrence":
        return (
          <TableRow>
            <TableHead className="whitespace-nowrap">共现关键词</TableHead>
            <TableHead className="text-right whitespace-nowrap">共现次数</TableHead>
          </TableRow>
        )
      case "volume":
        return (
          <TableRow>
            <TableHead className="whitespace-nowrap">中介关键词</TableHead>
            <TableHead className="text-right whitespace-nowrap">共现搜索量</TableHead>
            <TableHead className="text-right whitespace-nowrap">中介词总搜索量</TableHead>
            <TableHead className="text-right whitespace-nowrap">共现比例(%)</TableHead>
            <TableHead className="text-right whitespace-nowrap">权重</TableHead>
          </TableRow>
        )
      case "competitors":
        return (
          <TableRow>
            <TableHead className="whitespace-nowrap">竞争关键词</TableHead>
            <TableHead className="whitespace-nowrap">关联中介词</TableHead>
            <TableHead className="text-right whitespace-nowrap">共现搜索量</TableHead>
            <TableHead className="text-right whitespace-nowrap">基础竞争度</TableHead>
            <TableHead className="text-right whitespace-nowrap">加权竞争度</TableHead>
          </TableRow>
        )
    }
  }

  const renderTableBody = () => {
    switch (type) {
      case "overview":
        const overviewData = data as AnalysisDetail
        return (
          <TableRow>
            <TableCell>{overviewData.seed_keyword}</TableCell>
            <TableCell className="text-right">{overviewData.total_search_volume.toLocaleString()}</TableCell>
            <TableCell className="text-right">{overviewData.seed_search_volume.toLocaleString()}</TableCell>
            <TableCell className="text-right">{overviewData.seed_search_ratio.toFixed(2)}%</TableCell>
          </TableRow>
        )
      case "cooccurrence":
        const cooccurrenceData = data as Cooccurrence[]
        return cooccurrenceData.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.keyword}</TableCell>
            <TableCell className="text-right">{item.cooccurrence_count.toLocaleString()}</TableCell>
          </TableRow>
        ))
      case "volume":
        const volumeData = data as SearchVolume[]
        return volumeData.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.mediator_keyword}</TableCell>
            <TableCell className="text-right">{item.cooccurrence_volume.toLocaleString()}</TableCell>
            <TableCell className="text-right">{item.mediator_total_volume.toLocaleString()}</TableCell>
            <TableCell className="text-right">{item.cooccurrence_ratio.toFixed(2)}%</TableCell>
            <TableCell className="text-right">{item.weight.toFixed(2)}</TableCell>
          </TableRow>
        ))
      case "competitors":
        const competitorData = data as Competitor[]
        return competitorData.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.competitor_keyword}</TableCell>
            <TableCell>{item.mediator_keywords}</TableCell>
            <TableCell className="text-right">{item.cooccurrence_volume.toLocaleString()}</TableCell>
            <TableCell className="text-right">{item.base_competition_score.toFixed(2)}</TableCell>
            <TableCell className="text-right">{item.weighted_competition_score.toFixed(2)}</TableCell>
          </TableRow>
        ))
    }
  }

  const renderContent = () => {
    switch (type) {
      case "overview":
        const overviewData = data as AnalysisDetail
        return (
          <div>
            <OverviewChart data={overviewData} />
            {overviewData.user_profiles && overviewData.user_profiles.length > 0 && (
              <div className="mt-8">
                <UserProfilesChart data={overviewData.user_profiles} />
              </div>
            )}
            <Table>
              <TableHeader>
                {renderTableHeader()}
              </TableHeader>
              <TableBody>
                {renderTableBody()}
              </TableBody>
            </Table>
          </div>
        )
      case "cooccurrence":
        return (
          <div>
            <CooccurrenceChart data={data as Cooccurrence[]} />
            <Table>
              <TableHeader>
                {renderTableHeader()}
              </TableHeader>
              <TableBody>
                {renderTableBody()}
              </TableBody>
            </Table>
          </div>
        )
      case "volume":
        return (
          <div>
            <VolumeChart data={data as SearchVolume[]} />
            <Table>
              <TableHeader>
                {renderTableHeader()}
              </TableHeader>
              <TableBody>
                {renderTableBody()}
              </TableBody>
            </Table>
          </div>
        )
      case "competitors":
        return (
          <div>
            <CompetitorChart data={data as Competitor[]} />
            <Table>
              <TableHeader>
                {renderTableHeader()}
              </TableHeader>
              <TableBody>
                {renderTableBody()}
              </TableBody>
            </Table>
          </div>
        )
      case "user-profiles":
        const profileData = data as UserProfile[]
        return (
          <div>
            <UserProfilesChart 
              data={profileData} 
              analysisId={analysisId} 
            />
          </div>
        )
    }
  }

  return (
    <Card className="p-6">
      {renderContent()}
    </Card>
  )
} 