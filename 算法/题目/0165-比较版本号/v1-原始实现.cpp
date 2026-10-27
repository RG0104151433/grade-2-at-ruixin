// 说明：本文件由 `v1-原始实现.cpp` 拆出（该文件里写了 2 份实现），这是第 1 份。

class Solution {
public:
    int compareVersion(string version1, string version2) {
        int v1=0,v2=0,p1=0,p2=0;
        vector<int> n1;
        vector<int> n2;
        while (v1<version1.size()) {
            while (v1<version1.size() && version1[v1]!='.') v1++;
            int c1=0;
            for (int i=p1;i<v1;i++) c1=10*c1+(version1[i]-'0');
            v1++;
            p1=v1;
            n1.emplace_back(c1);
        }
        while (v2<version2.size()) {
            while (v2<version2.size() && version2[v2]!='.') v2++;
            int c2=0;
            for (int i=p2;i<v2;i++) c2=10*c2+(version2[i]-'0');
            v2++;
            p2=v2;
            n2.emplace_back(c2);
        }
        int c1=0,c2=0;
        int l=min(n1.size(),n2.size());
        for (int i=0;i<l;i++) {
            if (n1[i]==n2[i]) continue;
            else if (n1[i]>n2[i]) return 1;
            else return -1;
        }
        if (n1.size()==n2.size()) return 0;
        else if (n1.size()>n2.size()) {
            for (int i=l;i<n1.size();i++) {
                if (n1[i]>0) return 1;
            }
        }
        else {
            for (int i=l;i<n2.size();i++) {
                if (n2[i]>0) return -1;
            }
        }
        return 0;
    }
};
