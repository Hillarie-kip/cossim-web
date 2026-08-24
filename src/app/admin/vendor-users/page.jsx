"use client";
import React, { useEffect, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { Table, Input, Button, Spin } from "antd";
import { useRouter } from "next/navigation";

const VendorUsersAdminPage = () => {
  const { fetchUsersByVendor, usersByVendor, loading, error } = useAdmin();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [total, setTotal] = useState(0);
  const [data, setData] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchUsersByVendor({ PageNO: page, PageSize: pageSize, SearchTerm: searchTerm })
      .then((res) => {
        setTotal(res.TotalCount || 0);
        setData(res.Data || []);
      })
      .catch(() => {});
  }, [page, pageSize, searchTerm]);

  const columns = [
    { title: "Name", dataIndex: "fullName", key: "fullName" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phoneNumber", key: "phoneNumber" },
    { title: "Role", dataIndex: "roleName", key: "roleName" },
    { title: "Vendor", dataIndex: "vendorName", key: "vendorName" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button type="link" onClick={() => router.push(`/admin/users/${record.userCode}`)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2>All Vendor Users</h2>
      <Input.Search
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onSearch={setSearchTerm}
        style={{ width: 300, marginBottom: 16 }}
      />
      {error && <div className="alert alert-danger">{error}</div>}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey={(record) => record.userCode}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['50', '100', '200', '500'],
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Spin>
    </div>
  );
};

export default VendorUsersAdminPage;
