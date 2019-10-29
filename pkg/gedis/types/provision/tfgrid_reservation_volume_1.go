package provision

import (
	"fmt"

	"github.com/threefoldtech/zos/pkg/provision"
)

//TfgridReservationVolume1 jsx schema
type TfgridReservationVolume1 struct {
	WorkloadID      int64                               `json:"workload_id"`
	NodeID          string                              `json:"node_id"`
	Size            int64                               `json:"size"`
	Type            TfgridReservationVolume1TypeEnum    `json:"type"`
	StatsAggregator []TfgridReservationStatsaggregator1 `json:"stats_aggregator"`
}

// ToProvisionType converts TfgridReservationVolume1 to provision.Volume
func (v TfgridReservationVolume1) ToProvisionType() (provision.Volume, error) {
	volume := provision.Volume{
		Size: uint64(v.Size),
	}
	switch v.Type.String() {
	case "HDD":
		volume.Type = provision.HDDDiskType
	case "SSD":
		volume.Type = provision.SSDDiskType
	default:
		return volume, fmt.Errorf("disk type %s not supported", v.Type.String())
	}
	return volume, nil
}

//TfgridReservationVolume1TypeEnum jsx schema
type TfgridReservationVolume1TypeEnum uint8

//TfgridReservationVolume1TypeEnum
const (
	TfgridReservationVolume1TypeHDD TfgridReservationVolume1TypeEnum = iota
	TfgridReservationVolume1TypeSSD
)

// String implements Stringer interface
func (e TfgridReservationVolume1TypeEnum) String() string {
	switch e {
	case TfgridReservationVolume1TypeHDD:
		return "HDD"
	case TfgridReservationVolume1TypeSSD:
		return "SSD"
	}
	return "UNKNOWN"
}
