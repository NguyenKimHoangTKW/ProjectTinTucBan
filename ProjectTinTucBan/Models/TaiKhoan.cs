

namespace ProjectTinTucBan.Models
{
    using System;
    using System.Collections.Generic;
    
    public partial class TaiKhoan
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public TaiKhoan()
        {
            this.BaiViets = new HashSet<BaiViet>();
        }
    
        public int ID { get; set; }
        public Nullable<int> ID_role { get; set; }
        public string TenTaiKhoan { get; set; }
        public string MatKhau { get; set; }
        public string Gmail { get; set; }
        public string SDT { get; set; }
        public Nullable<bool> IsBanned { get; set; }
        public Nullable<int> NgayTao { get; set; }
        public Nullable<int> NgayCapNhat { get; set; }
    
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<BaiViet> BaiViets { get; set; }
        public virtual Role Role { get; set; }
    }
}
